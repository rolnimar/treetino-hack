import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service';
import { dailySpotPrices, type SpotPriceQuote } from '../database/schema';
import type { InvoicePricing } from '@treetino/contracts';

const SCALE = 1_000_000n;
function decimal(value: string) {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d+(\.\d{1,6})?$/.test(normalized))
    throw new Error('Invalid published decimal');
  const negative = normalized.startsWith('-');
  const [whole, fraction = ''] = normalized.replace('-', '').split('.');
  const result = BigInt(whole!) * SCALE + BigInt(fraction.padEnd(6, '0'));
  return negative ? -result : result;
}
function divide(numerator: bigint, denominator: bigint) {
  if (denominator <= 0n) throw new Error('Invalid exchange rate');
  const absolute = numerator < 0n ? -numerator : numerator;
  const rounded = (absolute + denominator / 2n) / denominator;
  return numerator < 0n ? -rounded : rounded;
}
function format(value: bigint, digits: number) {
  const magnitude = value < 0n ? -value : value;
  const scale = 10n ** BigInt(digits);
  return `${value < 0n ? '-' : ''}${magnitude / scale}.${(magnitude % scale).toString().padStart(digits, '0')}`;
}
const prague = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Prague',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
function localParts(timestamp: number) {
  return Object.fromEntries(
    prague
      .formatToParts(new Date(timestamp * 1000))
      .map((part) => [part.type, part.value]),
  );
}
export function pragueDate(timestamp: number) {
  const parts = localParts(timestamp);
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function localTime(timestamp: number) {
  const parts = localParts(timestamp);
  return `${parts.hour}:${parts.minute}`;
}
export function pragueMidnight(date: string) {
  const utc = Date.parse(date + 'T00:00:00Z') / 1000;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(utc) ||
    new Date(utc * 1000).toISOString().slice(0, 10) !== date
  )
    throw new Error('Invalid pricing date');
  let timestamp = utc;
  for (let attempt = 0; attempt < 3; attempt++) {
    const p = localParts(timestamp);
    const represented =
      Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`) /
      1000;
    timestamp += utc - represented;
  }
  return timestamp;
}
export function pricingDates(dayStartTs: string, readingCount: number) {
  const start = Number(dayStartTs);
  return [
    ...new Set([
      new Date(start * 1000).toISOString().slice(0, 10),
      ...Array.from({ length: readingCount }, (_, index) =>
        pragueDate(start + index * 900),
      ),
    ]),
  ];
}
export function parseOtePrices(
  html: string,
  date: string,
): SpotPriceQuote['intervals'] {
  if (!html.includes(`data-default-select-date="${date}"`))
    throw new Error(`OTE did not return prices for ${date}`);
  const start = pragueMidnight(date);
  const nextDate = new Date(Date.parse(date + 'T00:00:00Z') + 86400_000)
    .toISOString()
    .slice(0, 10);
  const expectedCount = (pragueMidnight(nextDate) - start) / 900;
  const rows: { label: string; price: string }[] = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...match[1]!.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(
      (cell) => cell[1]!.replace(/<[^>]*>/g, '').trim(),
    );
    if (cells[0] && /^\d{2}[ab]?:\d{2}-\d{2}[ab]?:\d{2}$/i.test(cells[0]))
      rows.push({ label: cells[0], price: cells[1] ?? '' });
  }
  if (rows.length !== expectedCount)
    throw new Error(`OTE 15-minute price curve incomplete for ${date}`);
  return rows.map((row, index) => {
    const timestamp = start + index * 900;
    const [from, to] = row.label
      .replace(/[ab]/gi, '')
      .replace('24:00', '00:00')
      .split('-');
    if (from !== localTime(timestamp) || to !== localTime(timestamp + 900))
      throw new Error(`OTE 15-minute intervals out of order for ${date}`);
    return {
      startTs: timestamp.toString(),
      eurPerMwh: format(decimal(row.price), 6),
    };
  });
}
export function parseCnbRates(text: string, date: string) {
  const lines = text.trim().split(/\r?\n/);
  const published = lines[0]?.split(' #')[0];
  const timestamp = published ? Date.parse(`${published} 00:00:00 GMT`) : NaN;
  const requested = Date.parse(date + 'T00:00:00Z');
  if (
    !Number.isFinite(timestamp) ||
    timestamp > requested ||
    requested - timestamp > 7 * 86400_000
  )
    throw new Error(`CNB exchange rates unavailable for ${date}`);
  const read = (code: string) => {
    const row = lines
      .map((line) => line.split('|'))
      .find((parts) => parts[3] === code);
    if (!row || row[2] !== '1' || decimal(row[4]!) <= 0n)
      throw new Error(`CNB ${code}/CZK rate unavailable`);
    return format(decimal(row[4]!), 6);
  };
  return {
    eurCzk: read('EUR'),
    usdCzk: read('USD'),
    exchangeRateDate: new Date(timestamp).toISOString().slice(0, 10),
  };
}
export function priceInvoice(
  dayStartTs: string,
  wh: number[],
  quotes: SpotPriceQuote[],
): InvoicePricing {
  const date = new Date(Number(dayStartTs) * 1000).toISOString().slice(0, 10);
  const fx = quotes.find((quote) => quote.date === date);
  if (!fx) throw new Error(`Exchange rates unavailable for report day ${date}`);
  const prices = new Map(
    quotes.flatMap((quote) =>
      quote.intervals.map(
        (interval) => [interval.startTs, interval.eurPerMwh] as const,
      ),
    ),
  );
  let numerator = 0n;
  const intervals = wh.map((reading, index) => {
    const startTs = (BigInt(dayStartTs) + BigInt(index) * 900n).toString();
    const eurPerMwh = prices.get(startTs);
    if (eurPerMwh === undefined)
      throw new Error(
        `OTE price unavailable at ${new Date(Number(startTs) * 1000).toISOString()}`,
      );
    const line = BigInt(reading) * decimal(eurPerMwh) * decimal(fx.eurCzk);
    numerator += line;
    return {
      startTs,
      wh: reading,
      eurPerMwh,
      czkPerKwh: format(
        divide(decimal(eurPerMwh) * decimal(fx.eurCzk), 1000n * SCALE),
        6,
      ),
      totalCzk: format(divide(line, 1_000_000n * SCALE), 6),
    };
  });
  const rawAmount = divide(numerator, SCALE * decimal(fx.usdCzk));
  return {
    method: 'quarter-hour',
    date,
    eurCzk: fx.eurCzk,
    usdCzk: fx.usdCzk,
    exchangeRateDate: fx.exchangeRateDate,
    exchangeRateSource: fx.exchangeRateSource,
    priceSource: fx.priceSource,
    priceSources: quotes.map((quote) => ({
      date: quote.date,
      url: quote.priceSource,
    })),
    intervals,
    totalCzk: format(divide(numerator * 100n, 1_000_000n * SCALE * SCALE), 2),
    // Net negative-price credits cannot be represented by the program's unsigned invoice amount.
    amount:
      rawAmount >= 0n && rawAmount <= 18446744073709551615n
        ? rawAmount.toString()
        : null,
  };
}

@Injectable()
export class SpotPriceService {
  constructor(private readonly database: DatabaseService) {}

  async fetchDailyQuote(date: string): Promise<SpotPriceQuote> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      throw new Error('Invalid pricing date');
    const priceSource = `https://www.ote-cr.cz/en/short-term-markets/electricity/day-ahead-market?report_date=${date}&time_resolution=PT15M`;
    const [year, month, day] = date.split('-');
    const exchangeRateSource = `https://www.cnb.cz/en/financial-markets/foreign-exchange-market/central-bank-exchange-rate-fixing/central-bank-exchange-rate-fixing/daily.txt?date=${day}.${month}.${year}`;
    const read = async (url: string) => {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok)
        throw new Error(`Price source returned HTTP ${response.status}`);
      return response.text();
    };
    const [html, rates] = await Promise.all([
      read(priceSource),
      read(exchangeRateSource),
    ]);
    const intervals = parseOtePrices(html, date);
    const fx = parseCnbRates(rates, date);
    return {
      method: 'quarter-hour',
      date,
      intervals,
      ...fx,
      priceSource,
      exchangeRateSource,
    };
  }

  async quote(date: string) {
    const [saved] = await this.database.db
      .select()
      .from(dailySpotPrices)
      .where(eq(dailySpotPrices.date, date));
    if (saved?.quote.method === 'quarter-hour') return saved.quote;
    const quote = await this.fetchDailyQuote(date);
    await this.database.db
      .insert(dailySpotPrices)
      .values({ date, quote })
      .onConflictDoUpdate({ target: dailySpotPrices.date, set: { quote } });
    const [persisted] = await this.database.db
      .select()
      .from(dailySpotPrices)
      .where(eq(dailySpotPrices.date, date));
    return persisted!.quote;
  }
}
