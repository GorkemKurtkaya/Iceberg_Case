import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from './schemas/transaction.schema';
import { CommissionService } from './services/commission.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

const ALLOWED: Record<string, string[]> = {
  agreement: ['earnest_money'],
  earnest_money: ['title_deed'],
  title_deed: ['completed'],
  completed: [],
};

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private txModel: Model<TransactionDocument>,
    private commissionService: CommissionService,
  ) {}

  async create(dto: CreateTransactionDto) {
    const created = new this.txModel({ 
      propertyId: new Types.ObjectId(dto.propertyId),
      listingAgentId: new Types.ObjectId(dto.listingAgentId),
      sellingAgentId: new Types.ObjectId(dto.sellingAgentId),
      totalServiceFee: dto.totalServiceFee,
      stage: 'agreement'
    });
    return created.save();
  }

  async getById(id: string) {
    return this.txModel.findById(id).lean();
  }

  async updateStage(id: string, newStage: string) {
    const tx = await this.txModel.findById(id);
    if (!tx) throw new BadRequestException('Transaction not found');

    const allowed = ALLOWED[tx.stage] || [];
    if (!allowed.includes(newStage)) {
      throw new BadRequestException(`Invalid stage transition from ${tx.stage} to ${newStage}`);
    }

    tx.stage = newStage;

    if (newStage === 'completed') {
      const breakdown = this.commissionService.calculate(
        tx.totalServiceFee,
        tx.listingAgentId.toString(),
        tx.sellingAgentId.toString(),
      );
      tx.financialBreakdown = breakdown;
    }

    await tx.save();
    return tx.toObject();
  }

  async list() {
    return this.txModel.find().sort({ createdAt: -1 }).lean();
  }
}
