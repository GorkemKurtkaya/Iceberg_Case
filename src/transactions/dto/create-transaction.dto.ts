import { IsMongoId, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateTransactionDto {
  @IsMongoId()
  propertyId: string;

  @IsMongoId()
  listingAgentId: string;

  @IsMongoId()
  sellingAgentId: string;

  @IsNumber()
  totalServiceFee: number;
}
