import { IsMongoId, IsNumber, IsNotEmpty } from 'class-validator';
import { getValidationMessage } from '../../_common/enums/ValidationMessages.enum';
import { DtoPrefix } from '../../_common/enums/ValidationMessages.enum';
import { ValidationType } from '../../_common/enums/ValidationMessages.enum';

export class CreateTransactionDto {

  @IsMongoId({ message: getValidationMessage(DtoPrefix.PROPERTY, ValidationType.MUST_BE_MONGO_ID) })
  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.PROPERTY, ValidationType.NOT_EMPTY) })
  propertyId: string;

  @IsMongoId({ message: getValidationMessage(DtoPrefix.LISTING_AGENT, ValidationType.MUST_BE_MONGO_ID) })
  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.LISTING_AGENT, ValidationType.NOT_EMPTY) })
  listingAgentId: string;

  @IsMongoId({ message: getValidationMessage(DtoPrefix.SELLING_AGENT, ValidationType.MUST_BE_MONGO_ID) })
  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.SELLING_AGENT, ValidationType.NOT_EMPTY) })
  sellingAgentId: string;

  @IsNumber({}, { message: getValidationMessage(DtoPrefix.TOTAL, ValidationType.MUST_BE_NUMBER) })
  @IsNotEmpty({ message: getValidationMessage(DtoPrefix.TOTAL, ValidationType.NOT_EMPTY) })
  totalServiceFee: number;
}
