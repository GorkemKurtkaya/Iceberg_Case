import { CommissionService } from '../services/commission.service';

describe('CommissionService', () => {
  let svc: CommissionService;

  beforeEach(() => {
    svc = new CommissionService();
  });

  it('same agent gets full agent portion', () => {
    const agentId = '64b0f9a0c0f4a5d9e5c12345';
    const res = svc.calculate(1000, agentId, agentId);
    expect(res.company).toBe(500);
    expect(res.agents.length).toBe(1);
    expect(res.agents[0].amount).toBe(500);
    expect(res.total).toBe(1000);
  });

  it('different agents split agent portion', () => {
    const listingAgentId = '64b0f9a0c0f4a5d9e5c12345';
    const sellingAgentId = '64b0f9a0c0f4a5d9e5c12346';
    const res = svc.calculate(1000, listingAgentId, sellingAgentId);
    expect(res.company).toBe(500);
    expect(res.agents.length).toBe(2);
    expect(res.agents[0].amount + res.agents[1].amount).toBe(500);
    expect(res.agents[0].amount).toBeCloseTo(250);
    expect(res.total).toBe(1000);
  });

  it('handles zero totalServiceFee', () => {
    const listingAgentId = '64b0f9a0c0f4a5d9e5c12345';
    const sellingAgentId = '64b0f9a0c0f4a5d9e5c12346';
    const res = svc.calculate(0, listingAgentId, sellingAgentId);
    expect(res.company).toBe(0);
    expect(res.agents.reduce((s, a) => s + a.amount, 0)).toBe(0);
    expect(res.total).toBe(0);
  });
});
