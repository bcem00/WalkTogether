# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY backend/WalkTogetherAPI.sln .
COPY backend/WalkTogetherAPI/WalkTogetherAPI.csproj backend/WalkTogetherAPI/

# Restore dependencies
RUN dotnet restore backend/WalkTogetherAPI/WalkTogetherAPI.csproj

# Copy all source files
COPY backend/WalkTogetherAPI/ backend/WalkTogetherAPI/

# Build the application
WORKDIR /src/backend/WalkTogetherAPI
RUN dotnet build WalkTogetherAPI.csproj -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish WalkTogetherAPI.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Copy published application
COPY --from=publish /app/publish .

# Copy Queries folder (needed by DbInitializer)
# This assumes Docker build context is from the project root
COPY Queries /app/Queries

# Expose port (default ASP.NET Core port)
EXPOSE 8080
EXPOSE 8081

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Health check (using wget which is available in the base image, or remove if not needed)
# Note: You may need to add a /health endpoint to your API for this to work
# HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
#   CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Run the application
ENTRYPOINT ["dotnet", "WalkTogetherAPI.dll"]

