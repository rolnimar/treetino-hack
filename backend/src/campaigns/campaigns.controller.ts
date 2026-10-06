import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CampaignsService } from './campaigns.service';
import {
  CampaignDossierDto,
  CampaignsResponseDto,
  CreateCampaignRequestDto,
} from './campaigns.dto';
import { AdminGuard } from '../auth/auth.controller';

@ApiTags('Funding Campaigns')
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get()
  @ApiOperation({
    summary: 'List active and historical clean energy funding campaigns',
    description:
      'Returns Kickstarter-style project campaigns with on-chain funding progress and Victron hardware bindings.',
  })
  @ApiOkResponse({ type: CampaignsResponseDto })
  async listCampaigns(): Promise<CampaignsResponseDto> {
    return this.campaignsService.listCampaigns();
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Get detailed campaign dossier by ID, tree address, or Victron site ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Campaign ID, tree address, or Victron site ID',
  })
  @ApiOkResponse({ type: CampaignDossierDto })
  @ApiNotFoundResponse({ description: 'Campaign not found' })
  async getCampaign(@Param('id') id: string): Promise<CampaignDossierDto> {
    const campaign = await this.campaignsService.getCampaign(id);
    if (!campaign) {
      throw new NotFoundException(`Campaign ${id} not found`);
    }
    return campaign;
  }

  @Post()
  @ApiOperation({
    summary: 'Register or update rich campaign metadata for a tokenized tree',
  })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiCreatedResponse({ type: CampaignDossierDto })
  async createCampaign(
    @Body() dto: CreateCampaignRequestDto,
  ): Promise<CampaignDossierDto> {
    return this.campaignsService.createCampaign(dto);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update existing campaign metadata and PPA contract details',
  })
  @ApiParam({ name: 'id', description: 'Campaign ID or tree address' })
  @ApiBearerAuth()
  @UseGuards(AdminGuard)
  @ApiOkResponse({ type: CampaignDossierDto })
  async updateCampaign(
    @Param('id') _id: string,
    @Body() dto: CreateCampaignRequestDto,
  ): Promise<CampaignDossierDto> {
    return this.campaignsService.createCampaign(dto);
  }
}
