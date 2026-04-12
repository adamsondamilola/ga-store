# Ga Store

## Database

The backend now targets PostgreSQL through EF Core and Npgsql.

### Local Postgres

Start a local database with Docker:

```powershell
docker compose -f docker-compose.postgres.yml up -d
```

The default local connection string is:

```text
Host=localhost;Port=5432;Database=gastore;Username=postgres;Password=postgres;Include Error Detail=true
```

You can also override it with the standard ASP.NET Core configuration key:

```powershell
$env:ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=gastore;Username=postgres;Password=postgres;Include Error Detail=true"
```

### EF Core

Apply migrations:

```powershell
dotnet tool restore --tool-manifest GaStore/.config/dotnet-tools.json
dotnet ef database update --project GaStore.Data/GaStore.Data.csproj --startup-project GaStore/GaStore.csproj
```

## Upload Microservice

A dedicated upload API now lives in `GaStore.UploadService`.

Run it locally:

```powershell
dotnet run --project GaStore.UploadService/GaStore.UploadService.csproj
```

To make the main API delegate uploads to it, update the `UploadService` section in `GaStore/appsettings*.json`:

```json
"UploadService": {
  "Enabled": true,
  "BaseUrl": "https://localhost:7262",
  "ApiKey": "change-me"
}
```

Use the same API key in `GaStore.UploadService/appsettings*.json`.
