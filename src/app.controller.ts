import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Get()
  getHello(): string {
    return `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Iceberg Transactions API</title>
            <style>
              body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #0b1120; color: #e5e7eb; }
              .container { max-width: 720px; margin: 0 auto; }
              h1 { font-size: 26px; margin: 0 0 8px; letter-spacing: -0.03em; }
              p { margin: 4px 0 16px; font-size: 14px; color: #9ca3af; }
              .box { border-radius: 12px; border: 1px solid rgba(55,65,81,0.9); padding: 16px 18px; background: rgba(15,23,42,0.9); margin-bottom: 12px; }
              .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.16em; color: #6b7280; margin-bottom: 6px; }
              ul { margin: 0; padding-left: 18px; font-size: 13px; }
              li { margin-bottom: 4px; }
              code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 12px; background: #020617; padding: 2px 6px; border-radius: 4px; border: 1px solid #1f2937; }
              .tag-row { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
              .tag { font-size: 11px; padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(55,65,81,0.9); background: rgba(15,23,42,0.9); }
              .health { font-size: 12px; color: #9ca3af; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Iceberg Transactions API</h1>
              <p>Backend for real estate transaction stages and commission distribution between agency and agents.</p>

              <div class="tag-row">
                <span class="tag">NestJS · TypeScript · MongoDB Atlas</span>
                <span class="tag">Stages: agreement → earnest_money → title_deed → completed</span>
              </div>

              <div class="box">
                <div class="label">Core endpoints</div>
                <ul>
                  <li><code>GET /health</code> – health check</li>
                  <li><code>POST /transactions</code> – create transaction</li>
                  <li><code>GET /transactions</code> – list transactions</li>
                  <li><code>GET /transactions/:id</code> – transaction detail + breakdown</li>
                  <li><code>PATCH /transactions/:id/stage</code> - change stage</li>
                </ul>
              </div>

              <div class="box">
                <div class="label">Commission rules</div>
                <ul>
                  <li>50% of total service fee goes to the agency</li>
                  <li>50% goes to the agents</li>
                  <li>Same agent (listing = selling): full 50% to that agent</li>
                  <li>Different agents: 25% + 25%</li>
                </ul>
              </div>

              <p class="health">See <code>README.md</code> and <code>DESIGN_ENG.md</code> for more details.</p>
            </div>
          </body>
          </html>
    `;
  }

  @Get('/health')
  getHealth(): string {
    const dbOk = this.connection.readyState === 1;
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Health</title>
          <style>
            body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 24px; background: #020617; color: #e5e7eb; }
            .pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: #020617; border: 1px solid #1f2937; font-size: 13px; }
            .dot { width: 8px; height: 8px; border-radius: 999px; background: ${dbOk ? '#22c55e' : '#ef4444'}; }
            .label { font-weight: 500; }
            .sub { font-size: 12px; color: #9ca3af; margin-top: 8px; }
          </style>
        </head>
        <body>
          <div class="pill">
            <span class="dot"></span>
            <span class="label">API: OK</span>
            <span>| DB: ${dbOk ? 'UP' : 'DOWN'}</span>
          </div>
          <div class="sub">This endpoint is safe to use for basic uptime checks.</div>
        </body>
        </html>
    `;
  }
}
