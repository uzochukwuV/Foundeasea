import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { AgentsModule } from '../agents/agents.module';
import { IdeasModule } from '../ideas/ideas.module';

@Module({
  imports: [BlockchainModule, AgentsModule, IdeasModule],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}