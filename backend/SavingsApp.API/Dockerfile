# ---- build stage ----
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["SavingsApp.API/SavingsApp.API.csproj", "SavingsApp.API/"]
RUN dotnet restore "SavingsApp.API/SavingsApp.API.csproj"

COPY . .
WORKDIR "/src/SavingsApp.API"
RUN dotnet publish "SavingsApp.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ---- runtime stage ----
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SavingsApp.API.dll"]
