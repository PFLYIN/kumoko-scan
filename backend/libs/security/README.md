# @kumoko/security

Autenticacao, autorizacao e protecoes HTTP.

| Pasta | Conteudo |
|---|---|
| `security.module.ts` | `SecurityModule.forRoot()`: guards globais `ThrottlerGuard` (100 req/60s) -> `JwtAuthGuard` (deny-by-default) -> `RolesGuard`; exporta `JwtModule` (JWT_SECRET, HS256) e `PasswordHasher`. |
| `guards/` | `JwtAuthGuard` (Bearer ou cookie `kumoko_token`; preenche `request.user`), `RolesGuard`. |
| `decorators/` | `@Public()`, `@Roles('admin')`, `@CurrentUser()` / `@CurrentUser('id')`. |
| `jwt/` | `AuthenticatedUser`, `JwtPayload`, `toJwtPayload()`, `fromJwtPayload()`, `AUTH_COOKIE_NAME`, `buildAuthCookieOptions(config)`, `buildClearAuthCookieOptions(config)`, `parseDurationToSeconds()`, `extractAccessToken()`. |
| `passwords/` | `PasswordHasher` (bcryptjs, custo 12), `isStrongPassword()`, `PASSWORD_POLICY_REGEX`, `PASSWORD_POLICY_MESSAGE`. |
| `uploads/` | `createImageUploadOptions({ maxSizeMb })` (multer em memoria + filtro), `assertImageMagicBytes(buffer)`, `generateSafeFileName(ext)`. |
| `throttling/` | `AUTH_THROTTLE` (5/min), `Throttle`, `SkipThrottle`. |
| `http/` | `createHelmetMiddleware()`, `buildCorsOptions(CORS_ORIGINS)`. |
