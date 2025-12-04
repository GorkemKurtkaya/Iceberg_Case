import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class CommissionService {
  calculate(totalServiceFee: number, listingAgentId: string, sellingAgentId: string) {
    const company = +(totalServiceFee * 0.5).toFixed(2);
    const agentPortionTotal = +(totalServiceFee * 0.5).toFixed(2);
    const agents: { agentId: Types.ObjectId; amount: number; reason: string }[] = [];

    if (listingAgentId === sellingAgentId) {
      agents.push({
        agentId: new Types.ObjectId(listingAgentId),
        amount: agentPortionTotal,
        reason: 'listing_and_selling_agent',
      });
    } else {
      const each = +(agentPortionTotal / 2).toFixed(2);
      agents.push({
        agentId: new Types.ObjectId(listingAgentId),
        amount: each,
        reason: 'listing_agent',
      });
      agents.push({
        agentId: new Types.ObjectId(sellingAgentId),
        amount: each,
        reason: 'selling_agent',
      });
    }

    return {
      company,
      agents,
      total: company + agents.reduce((s, a) => s + a.amount, 0),
    };
  }
}
