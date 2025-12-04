import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseResponse } from '../../_base/response/base.response';
import { ResponseMessages } from '../enums/ResponseMessages.enum';
import { DtoPrefix } from '../enums/ValidationMessages.enum';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const prefixList: DtoPrefix[]=Object.values(DtoPrefix);
    const validationmessages=prefixList.find(prefix =>{
        return(exception.message && exception.message.startsWith(prefix))
    })

    if(validationmessages){
        response
            .status(status)
            .json(new BaseResponse(null, exception.message, status, false));
            
    } else {
        var responseMessage: string;
        switch (status) {
            case 404:
                responseMessage = ResponseMessages.NOT_FOUND;
                break;
            case 400:
                responseMessage = ResponseMessages.BAD_REQUEST;
                break;
            case 401:
                responseMessage = ResponseMessages.UNAUTHORIZED;
                break;
            case 403:
                responseMessage = ResponseMessages.FORBIDDEN;
                break;
            case 500:
                responseMessage = ResponseMessages.INTERNAL_SERVER_ERROR;
                break;
            default:
                responseMessage = ResponseMessages.ERROR;
                break;
        }
    
        response
          .status(status)
          .json(new BaseResponse(null, responseMessage, status, false));
      }
    }


}