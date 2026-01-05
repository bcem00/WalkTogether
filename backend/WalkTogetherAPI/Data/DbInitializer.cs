using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;

namespace WalkTogether.Data
{
    public static class DbInitializer
    {
        /// <summary>
        /// Initialize database synchronously: kept for compatibility but prefers async version.
        /// </summary>
        public static void Initialize(AppDbContext context, string? queriesFolder = null)
        {
            // Delegate to async method and wait (note: calling .GetAwaiter().GetResult() to preserve original sync behaviour)
            InitializeAsync(context, queriesFolder).GetAwaiter().GetResult();
        }

        /// <summary>
        /// Initialize database asynchronously: apply migrations and execute raw SQL scripts found in the Queries folder.
        /// </summary>
        public static async System.Threading.Tasks.Task InitializeAsync(AppDbContext context, string? queriesFolder = null)
        {
            // 1) Apply pending migrations
            // await context.Database.MigrateAsync();

            // 2) Find the Queries folder (allowing a few common locations so it works both in dev and deployed apps)
            string? folder = null;
            if (!string.IsNullOrWhiteSpace(queriesFolder) && Directory.Exists(queriesFolder))
                folder = queriesFolder;

            var candidates = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "Queries"),
                Path.Combine(AppContext.BaseDirectory, "Queries"),
                Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "Queries")),
                Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Queries")),
                Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "Queries")),
            };

            if (folder == null)
            {
                folder = candidates.FirstOrDefault(Directory.Exists);
            }

            if (string.IsNullOrWhiteSpace(folder))
            {
                Console.WriteLine("DbInitializer: no Queries folder found — skipping raw SQL execution.");
                return;
            }

            Console.WriteLine($"DbInitializer: executing SQL scripts from '{folder}'");

            var sqlFiles = Directory.GetFiles(folder, "*.sql").OrderBy(p => p).ToArray();
            if (!sqlFiles.Any())
            {
                Console.WriteLine("DbInitializer: no .sql files found in Queries folder.");
                return;
            }

            // Execute files inside a transaction so partial runs don't leave DB half-updated.
            await using var transaction = await context.Database.BeginTransactionAsync();
            try
            {
                foreach (var file in sqlFiles)
                {
                    Console.WriteLine($"DbInitializer: executing {Path.GetFileName(file)}");
                    var sql = await File.ReadAllTextAsync(file);

                    // Split by lines that contain only GO (common batch separator from SSMS/SQL Server tools)
                    var batches = Regex.Split(sql, "^\\s*GO\\s*$", RegexOptions.Multiline | RegexOptions.IgnoreCase);

                    foreach (var batch in batches)
                    {
                        if (string.IsNullOrWhiteSpace(batch))
                            continue;

                        await context.Database.ExecuteSqlRawAsync(batch);
                    }
                }

                await transaction.CommitAsync();
                Console.WriteLine("DbInitializer: SQL scripts executed successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DbInitializer ERROR: {ex.Message}");
                try { await transaction.RollbackAsync(); } catch { }
                throw; // rethrow so the app startup sees the error
            }
        }
    }
}