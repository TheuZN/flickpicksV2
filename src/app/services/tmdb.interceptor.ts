import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const tmdbInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.linkUrl)) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${environment.acessToken}` },
    });
  }
  return next(req);
};