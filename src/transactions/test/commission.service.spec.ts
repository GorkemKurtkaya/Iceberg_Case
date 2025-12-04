import { CommissionService } from '../services/commission.service';

describe('CommissionService', () => {
  let svc: CommissionService;
  beforeEach(() => svc = new CommissionService());

  it('same agent gets full agent portion', () => {
    const res = svc.calculate(1000, 'A', 'A');
    expect(res.company).toBe(500);
    expect(res.agents.length).toBe(1);
    expect(res.agents[0].amount).toBe(500);
  });

  it('different agents split agent portion', () => {
    const res = svc.calculate(1000, 'A', 'B');
    expect(res.company).toBe(500);
    expect(res.agents.length).toBe(2);
    expect(res.agents[0].amount + res.agents[1].amount).toBe(500);
    expect(res.agents[0].amount).toBeCloseTo(250);
  });
});
