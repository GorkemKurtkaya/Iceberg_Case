export enum DtoPrefix {
    STAGE = 'Stage',
    REQUEST = 'Request',
    RESPONSE = 'Response',
    ERROR = 'Error',
    SELLING_AGENT = 'Selling Agent',
    LISTING_AGENT = 'Listing Agent',
    PROPERTY = 'Property',
    TRANSACTION = 'Transaction',
    COMMISSION = 'Commission',
    AGENT = 'Agent',
    COMPANY = 'Company',
    TOTAL = 'Total',
    REASON = 'Reason',
    AMOUNT = 'Amount',
    DATE = 'Date',
    TIME = 'Time',
    URL = 'Url',
    UUID = 'Uuid',
    MONGO_ID = 'MongoId',
    ARRAY = 'Array',
    OBJECT = 'Object',
}


export enum ValidationType{
    NOT_EMPTY = 'CanNotBeEmpty',
    MUST_BE_STRING = 'MustBeString',
    MUST_BE_NUMBER = 'MustBeNumber',
    MUST_BE_BOOLEAN = 'MustBeBoolean',
    MUST_BE_DATE = 'MustBeDate',
    MUST_BE_DATE_TIME = 'MustBeDateTime',
    MUST_BE_TIME = 'MustBeTime',
    MUST_BE_URL = 'MustBeUrl',
    MUST_BE_UUID = 'MustBeUuid',
    MUST_BE_MONGO_ID = 'MustBeMongoId',
    MUST_BE_ARRAY = 'MustBeArray',
    MUST_BE_OBJECT = 'MustBeObject',
    MUST_BE_ENUM = 'MustBeEnum',
    MUST_BE_REGEX = 'MustBeRegex',
    INVALID_STAGE_TRANSITION = 'Invalid Stage Transition From {from} To {to}',
}

export function getValidationMessage(prefix: DtoPrefix, type: ValidationType, ...args: any): string{
    if (type === ValidationType.INVALID_STAGE_TRANSITION && args.length === 2) {
        return `${prefix}_Invalid Stage Transition From ${args[0]} To ${args[1]}`;
    }
    const message = `${prefix}_${type}${args.length > 0 ? `_${args.join('_')}` : ''}`;
    return message;
} 