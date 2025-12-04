import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TransactionsService } from '../transactions.service';
import { CommissionService } from '../services/commission.service';
import { Transaction } from '../schemas/transaction.schema';
import { BadRequestException } from '@nestjs/common';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let commissionService: CommissionService;
  let model: any;

  beforeEach(async () => {
    const modelMock = {
      findById: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        CommissionService,
        {
          provide: getModelToken(Transaction.name),
          useValue: modelMock,
        },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    commissionService = module.get<CommissionService>(CommissionService);
    model = module.get(getModelToken(Transaction.name));
  });

  it('getById returns transaction when found', async () => {
    const tx = { _id: '1', stage: 'agreement' };
    model.findById.mockReturnValue({ lean: () => tx });

    const result = await service.getById('1');
    expect(result).toEqual(tx);
  });

  it('getById throws when transaction not found', async () => {
    model.findById.mockReturnValue({ lean: () => null });

    await expect(service.getById('1')).rejects.toThrow(BadRequestException);
  });

  it('updateStage changes stage for valid transition', async () => {
    const save = jest.fn();
    const toObject = jest.fn().mockReturnValue({ _id: '1', stage: 'earnest_money' });
    model.findById.mockResolvedValue({
      _id: '1',
      stage: 'agreement',
      totalServiceFee: 1000,
      listingAgentId: 'A',
      sellingAgentId: 'B',
      save,
      toObject,
    });

    const result = await service.updateStage('1', 'earnest_money');

    expect(save).toHaveBeenCalled();
    expect(result.stage).toBe('earnest_money');
  });

  it('updateStage calculates commission on completed', async () => {
    const save = jest.fn();
    const toObject = jest.fn().mockReturnValue({ _id: '1', stage: 'completed' });
    const tx: any = {
      _id: '1',
      stage: 'title_deed',
      totalServiceFee: 1000,
      listingAgentId: 'A',
      sellingAgentId: 'B',
      save,
      toObject,
    };
    model.findById.mockResolvedValue(tx);

    const breakdown = { company: 500, agents: [], total: 1000 };
    const calculateSpy = jest
      .spyOn(commissionService, 'calculate')
      .mockReturnValue(breakdown as any);

    await service.updateStage('1', 'completed');

    expect(calculateSpy).toHaveBeenCalledWith(1000, 'A', 'B');
    expect(tx.financialBreakdown).toEqual(breakdown);
    expect(save).toHaveBeenCalled();
  });

  it('updateStage throws for invalid transition', async () => {
    model.findById.mockResolvedValue({
      _id: '1',
      stage: 'agreement',
      totalServiceFee: 1000,
      listingAgentId: 'A',
      sellingAgentId: 'B',
    });

    await expect(service.updateStage('1', 'title_deed')).rejects.toThrow(BadRequestException);
  });

  it('list returns sorted transactions', async () => {
    const data = [{ _id: '1' }, { _id: '2' }];
    model.find.mockReturnValue({
      sort: () => ({
        lean: () => data,
      }),
    });

    const result = await service.list();
    expect(result).toEqual(data);
  });
});
