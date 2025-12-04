import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DbKeepAliveService implements OnModuleInit {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit() {
    const intervalMs = 60 * 60 * 1000;
    setInterval(async () => {
      if (this.connection.readyState === 1 && this.connection.db) {
        try {
          await this.connection.db.admin().ping();
        } catch {}
      }
    }, intervalMs);
  }
}


