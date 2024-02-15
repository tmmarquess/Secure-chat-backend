import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class CustomRateLimitMiddleware implements NestMiddleware {
  private readonly maxAttempts = 10;

  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  private attemptsMap: Map<string, { count: number; lastAttemptTime: number }> =
    new Map();

  use(req: Request, res: Response, next: NextFunction) {
    const ipAddress = req.ip; // Você pode ajustar isso conforme necessário

    if (!this.attemptsMap.has(ipAddress)) {
      this.attemptsMap.set(ipAddress, {
        count: 1,
        lastAttemptTime: Date.now(),
      });
    } else {
      const now = Date.now();
      const { count, lastAttemptTime } = this.attemptsMap.get(ipAddress);

      if (now - lastAttemptTime > this.windowMs) {
        this.attemptsMap.set(ipAddress, { count: 0, lastAttemptTime: now });
      } else {
        if (count >= this.maxAttempts) {
          return res.status(429).json({
            message:
              'Limite de tentativas excedido. Tente novamente mais tarde.',
          });
        }
      }
    }

    // Se necessário, você pode ajustar este bloco para personalizar o comportamento com base no código de resposta
    res.on('finish', () => {
      const responseCode = res.statusCode;

      const now = Date.now();
      if (responseCode >= 400) {
        const count = this.attemptsMap.get(ipAddress).count;
        this.attemptsMap.set(ipAddress, {
          count: count + 1,
          lastAttemptTime: now,
        });
      }
      if (responseCode === 201) {
        this.attemptsMap.set(ipAddress, { count: 0, lastAttemptTime: now });
      }
      console.log(this.attemptsMap.get(ipAddress));
    });

    next();
  }
}
