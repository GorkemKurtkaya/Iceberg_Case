import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateStageDto } from './dto/update-stage.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly txService: TransactionsService) {}

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.txService.create(dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.txService.getById(id);
  }

  @Patch(':id/stage')
  updateStage(@Param('id') id: string, @Body() dto: UpdateStageDto) {
    return this.txService.updateStage(id, dto.stage);
  }

  @Get()
  list() {
    return this.txService.list();
  }
}
