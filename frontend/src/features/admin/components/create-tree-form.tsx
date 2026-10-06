import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { PublicKey } from '@solana/web3.js';
import { useAdmin } from '../admin-context';
import { useAuth } from '../../auth/auth-context';
import { createCampaignFormSchema } from '../schemas';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Field } from '../../../components/ui/field';
import { treeAddress } from '../../../chain/addresses';
import { api, jsonBody } from '../../../lib/api';
import { campaignDossierSchema } from '../../../lib/schemas';

interface ArchetypePreset {
  name: string;
  victronSiteId: number;
  title: string;
  subtitle: string;
  category: string;
  categoryBadge: string;
  city: string;
  country: string;
  projectedApy: string;
  tariffRate: string;
  offTakerName: string;
  target: string;
  narrative: string;
  story: string;
}

const PRESETS: ArchetypePreset[] = [
  {
    name: 'Off-Grid Solar Microgrid (Queensland · 8.5% APY)',
    victronSiteId: 209689,
    title: 'Off-Grid Solar Microgrid',
    subtitle: 'Queensland Rural Clean Energy Transition',
    category: 'Off-Grid Solar',
    categoryBadge: 'Off-Grid Solar',
    city: 'Queensland',
    country: 'Australia',
    projectedApy: '8.5%',
    tariffRate: '$0.40 / kWh metered consumer consumption',
    offTakerName: 'Queensland Rural Homeowner',
    target: '10000',
    narrative:
      'Community microgrid enabling permissionless clean power. Backers fund rooftop solar and lithium battery storage replacing expensive off-grid diesel generation.',
    story:
      'In remote regional Queensland, off-grid homeowners currently rely on costly diesel gensets running at up to $0.65/kWh. By tokenizing a high-capacity Victron MultiPlus-II inverter and lithium battery bank, investors fund the upfront hardware installation.',
  },
  {
    name: 'Commercial ESS Battery Storage (Amsterdam · 14.2% APY)',
    victronSiteId: 219742,
    title: 'Commercial ESS Battery Storage',
    subtitle: 'Amsterdam Wholesale Power Arbitrage',
    category: 'Battery Storage (BESS)',
    categoryBadge: 'Battery Storage (BESS)',
    city: 'Amsterdam',
    country: 'Netherlands',
    projectedApy: '14.2%',
    tariffRate:
      '$0.35 / kWh peak discharge spread + €45/MW/h grid frequency reserve',
    offTakerName: 'TenneT TSO & EPEX Spot Market',
    target: '50000',
    narrative:
      'Commercial grid-tied battery storage system (BESS). Solves renewable intermittency by charging during low-cost solar hours and discharging during peak windows.',
    story:
      'This 50 kWh commercial battery system in Amsterdam automatically charges from the Dutch grid when solar oversupply causes negative spot prices, and feeds back during peak windows.',
  },
  {
    name: 'Solar EV Fast-Charging Hub (Paris · 18.5% APY)',
    victronSiteId: 374891,
    title: 'Solar EV Fast-Charging Hub',
    subtitle: 'Parisian 10-Bay Commercial Mobility Plaza',
    category: 'EV Fast Charging',
    categoryBadge: 'EV Fast Charging',
    city: 'Paris',
    country: 'France',
    projectedApy: '18.5%',
    tariffRate:
      '$0.42 / kWh delivered + $2.50 session connection fee per charge',
    offTakerName: 'Commercial Fleet Operators & Retail EV Drivers',
    target: '10000',
    narrative:
      'Multi-bay commercial EV charging plaza buffered with solar and storage. Processes high daily energy throughput for vehicle micro-billing.',
    story:
      'Located at a high-traffic logistics hub near Paris, this installation deploys 10 high-power Victron EV Charging Stations backed by rooftop solar and buffer storage.',
  },
  {
    name: 'Treetino V1 Biomimetic Smart Energy Tree (Prague · 12.8% APY)',
    victronSiteId: 100001,
    title: 'Treetino V1 · Smart Energy Tree',
    subtitle: 'Biomimetic Solar + Wind Dual-Modality Microgrid',
    category: 'Biomimetic Tree',
    categoryBadge: 'Solar + Wind Tree',
    city: 'Prague',
    country: 'Czech Republic',
    projectedApy: '12.8%',
    tariffRate: '$0.32 / kWh metered corporate PPA (MKovo s.r.o.)',
    offTakerName: 'MKovo s.r.o. (Precision Manufacturing)',
    target: '235000',
    narrative:
      'Ultra-high density 12m vertical micro-power plant combining 300 heliotropic solar leaves and 12 ducted VAWT wind turbines on a 1.2 m² footprint.',
    story:
      'Treetino V1 integrates 300 astronomical sun-tracking photovoltaic leaves with 12 ducted vertical-axis wind turbines into a sculptural 12m smart tree powering industrial partner MKovo s.r.o.',
  },
];

export function CreateTreeForm() {
  const { setup, disabled, transaction, wallet } = useAdmin();
  const { session } = useAuth();
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const allowed =
    setup.data?.admins.includes(wallet) && setup.data.paymentTokenInitialized;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<
    z.input<typeof createCampaignFormSchema>,
    unknown,
    z.output<typeof createCampaignFormSchema>
  >({
    resolver: zodResolver(createCampaignFormSchema),
    defaultValues: {
      treeId: '1',
      target: '20000',
      supplier: '',
      client: '',
      reporter: '',
      title: 'Off-Grid Solar Microgrid Phase II',
      subtitle: 'Queensland Rural Clean Energy Transition',
      category: 'Off-Grid Solar',
      categoryBadge: 'Off-Grid Solar',
      city: 'Queensland',
      country: 'Australia',
      projectedApy: '8.5%',
      tariffRate: '$0.40 / kWh metered consumer consumption',
      offTakerName: 'Queensland Rural Resident',
      narrative:
        'Community microgrid enabling permissionless clean power. Backers fund rooftop solar and lithium battery storage replacing expensive off-grid diesel generation.',
      story:
        'Off-grid homeowner replacing diesel generation with tokenized rooftop solar equity.',
    },
  });

  const handleApplyPreset = (preset: ArchetypePreset) => {
    setValue('title', preset.title);
    setValue('subtitle', preset.subtitle);
    setValue('category', preset.category);
    setValue('categoryBadge', preset.categoryBadge);
    setValue('city', preset.city);
    setValue('country', preset.country);
    setValue('projectedApy', preset.projectedApy);
    setValue('tariffRate', preset.tariffRate);
    setValue('offTakerName', preset.offTakerName);
    setValue('target', preset.target);
    setValue('narrative', preset.narrative);
    setValue('story', preset.story);
    setValue('victronSiteId', preset.victronSiteId);
  };

  const onSubmit = async (data: z.output<typeof createCampaignFormSchema>) => {
    try {
      setSaveStatus('Initiating on-chain tree transaction…');
      // 1. Compute tree address
      const creatorKey = new PublicKey(wallet);
      const computedAddress = treeAddress(creatorKey, data.treeId).toBase58();

      // 2. Submit on-chain initTree transaction
      transaction.mutate(
        {
          action: 'initTree',
          treeId: data.treeId,
          target: data.target,
          supplier: data.supplier,
          client: data.client,
          reporter: data.reporter,
        },
        {
          onSuccess: async () => {
            // 3. Save campaign metadata to backend
            if (session) {
              setSaveStatus('Saving rich campaign story to database…');
              try {
                await api('campaigns', campaignDossierSchema, {
                  ...jsonBody({
                    treeAddress: computedAddress,
                    treeId: data.treeId,
                    title: data.title,
                    subtitle: data.subtitle,
                    category: data.category,
                    categoryBadge: data.categoryBadge,
                    narrative: data.narrative,
                    story: data.story,
                    investorHighlight: data.investorHighlight,
                    victronSiteId: data.victronSiteId,
                    city: data.city,
                    country: data.country,
                    projectedApy: data.projectedApy,
                    tariffRate: data.tariffRate,
                    offTakerName: data.offTakerName,
                    offTakerDescription: data.offTakerDescription,
                    supplierName: data.supplierName,
                    targetUsdc: data.target,
                  }),
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.accessToken}`,
                  },
                });
                setSaveStatus(
                  `Campaign "${data.title}" successfully published! Tree address: ${computedAddress.slice(0, 8)}…`,
                );
              } catch (err: unknown) {
                setSaveStatus(
                  `On-chain tree initialized. Metadata note: ${err instanceof Error ? err.message : String(err)}`,
                );
              }
            }
          },
        },
      );
    } catch (err: unknown) {
      setSaveStatus(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <Card title="Launch New Funding Opportunity (Kickstarter Campaign)">
      <p className="mb-4 text-sm text-forest/75">
        Set up a tokenized clean energy asset pool. Connect live Victron VRM
        telemetry, explain the off-taker agreement, and invite community
        investors to fund hardware on Solana.
      </p>

      {/* Preset Archetype Buttons */}
      <div className="mb-6 rounded-xl border border-forest/15 bg-forest/5 p-4">
        <span className="block font-mono text-xs font-bold text-forest uppercase">
          Quick Start from Verified Victron DePIN Hardware:
        </span>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.victronSiteId}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="rounded-lg border border-forest/20 bg-white px-3 py-1.5 text-xs font-bold text-forest hover:bg-forest/10 hover:border-forest/40 transition shadow-2xs"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {!allowed && (
        <p className="mb-4 text-sm text-amber-800">
          Initialize the payment token and ensure your wallet is listed in the
          chain admin list first.
        </p>
      )}

      {saveStatus && (
        <p className="mb-4 rounded-md bg-leaf/15 p-3 text-xs font-mono text-forest">
          {saveStatus}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <fieldset
          disabled={disabled || !allowed}
          className="space-y-6 disabled:opacity-60"
        >
          {/* Section 1: Campaign Narrative */}
          <div className="rounded-xl border border-forest/15 bg-white p-4">
            <h4 className="font-bold text-sm text-forest mb-3">
              1. Campaign Story & Asset Dossier
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Campaign Title"
                {...register('title')}
                error={errors.title?.message}
              />
              <Field
                label="Subtitle / Headline"
                {...register('subtitle')}
                error={errors.subtitle?.message}
              />
              <Field
                label="Category (e.g. Off-Grid Solar, Battery ESS)"
                {...register('category')}
                error={errors.category?.message}
              />
              <Field
                label="Category Badge"
                {...register('categoryBadge')}
                error={errors.categoryBadge?.message}
              />
              <Field
                label="Installation City"
                {...register('city')}
                error={errors.city?.message}
              />
              <Field
                label="Country"
                {...register('country')}
                error={errors.country?.message}
              />
            </div>
            <div className="mt-4">
              <Field
                label="Elevator Pitch / Narrative (1-2 sentences)"
                {...register('narrative')}
                error={errors.narrative?.message}
              />
            </div>
            <div className="mt-4">
              <Field
                label="Detailed Project Story & Hardware Specifications"
                {...register('story')}
                error={errors.story?.message}
              />
            </div>
          </div>

          {/* Section 2: Economics & Off-Taker PPA */}
          <div className="rounded-xl border border-forest/15 bg-white p-4">
            <h4 className="font-bold text-sm text-forest mb-3">
              2. Economics, Yield & Off-Taker PPA
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Projected Investor APY (e.g. 14.2%)"
                {...register('projectedApy')}
                error={errors.projectedApy?.message}
              />
              <Field
                label="Tariff Rate (e.g. $0.40/kWh)"
                {...register('tariffRate')}
                error={errors.tariffRate?.message}
              />
              <Field
                label="Off-Taker / Client Name"
                {...register('offTakerName')}
                error={errors.offTakerName?.message}
              />
              <Field
                label="Funding Target (mockUSDC)"
                {...register('target')}
                error={errors.target?.message}
              />
            </div>
          </div>

          {/* Section 3: On-Chain Wallets & Hardware Telemetry */}
          <div className="rounded-xl border border-forest/15 bg-white p-4">
            <h4 className="font-bold text-sm text-forest mb-3">
              3. On-Chain Protocol & Hardware Signers
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Tree ID (unique integer for your wallet)"
                {...register('treeId')}
                error={errors.treeId?.message}
              />
              <Field
                label="Victron VRM Site ID (optional, e.g. 209689)"
                type="number"
                {...register('victronSiteId', { valueAsNumber: true })}
                error={errors.victronSiteId?.message}
              />
              <Field
                label="Supplier Wallet (receives capital upon funding)"
                {...register('supplier')}
                error={errors.supplier?.message}
              />
              <Field
                label="Client Wallet (pays metered energy invoices)"
                {...register('client')}
                error={errors.client?.message}
              />
              <Field
                label="Reporter Wallet (Cerbo GX signer for production)"
                {...register('reporter')}
                error={errors.reporter?.message}
              />
            </div>
          </div>

          <Button type="submit" className="w-full sm:w-auto">
            Launch Campaign & Deploy On-Chain Pool →
          </Button>
        </fieldset>
      </form>
    </Card>
  );
}
