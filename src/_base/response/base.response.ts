export class BaseResponse<T> {

    DATA: T;
    MESSAGE: string;
    STATUS_CODE: number;
    SUCCESS: boolean;

    constructor(data: T, message: string, statusCode: number, success: boolean) {
        this.DATA = data;
        this.MESSAGE = message;
        this.STATUS_CODE = statusCode;
        this.SUCCESS = success;
    }
    
    
}