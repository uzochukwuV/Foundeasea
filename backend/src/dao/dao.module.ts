import { Module } from '@nestjs/common';
import { DaoService } from './dao.service';
import { DaoController } from './dao.controller';

@Module({
  providers: [DaoService],
  controllers: [DaoController],
  exports: [DaoService],
})
export class DaoModule {}