import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Property' })
  propertyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Agent' })
  listingAgentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Agent' })
  sellingAgentId: Types.ObjectId;

  @Prop({ required: true })
  totalServiceFee: number;

  @Prop({ enum: ['agreement','earnest_money','title_deed','completed'], default: 'agreement' })
  stage: string;

  @Prop({ type: Object, default: null })
  financialBreakdown: {
    company: number;
    total: number;
    agents: Array<{ agentId: Types.ObjectId; amount: number; reason: string }>;
  } | null;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
