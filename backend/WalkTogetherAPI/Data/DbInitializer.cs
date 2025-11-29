using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace WalkTogether.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // 1. Bekleyen migration'ları uygula (Tabloları oluşturur)
            context.Database.Migrate(); // Corrected casing for 'Migrate'

            // 2. Özel SQL Nesnelerini (Function, Trigger, Sequence) oluştur
            // Eğer bunlar zaten varsa hata vermemesi için "CREATE OR REPLACE" kullanıyoruz.

            // Örnek: Elite User <Fonksiyonu (Cursor kullanımı)
            var createFuncSql = @"
                    CREATE OR REPLACE FUNCTION check_elite_users(min_points INT) 
                    RETURNS TEXT AS $$
                    DECLARE 
                        user_rec RECORD;
                        user_cursor CURSOR FOR SELECT * FROM ""Users"" WHERE ""TotalPoints"" > min_points;
                        counter INT := 0;
                    BEGIN
                        OPEN user_cursor;
                        LOOP
                            FETCH user_cursor INTO user_rec;
                            EXIT WHEN NOT FOUND;
                            counter := counter + 1;
                        END LOOP;
                        CLOSE user_cursor;
                        RETURN 'Elite kullanıcı sayısı: ' || counter;
                    END;
                    $$ LANGUAGE plpgsql;
                ";

            context.Database.ExecuteSqlRaw(createFuncSql);

            // Örnek: Rota Sequence (İleride Route tablosu gelince işe yarayacak)
            // Sequence yoksa oluştur
            var createSeqSql = @"
                    DO $$ 
                    BEGIN 
                        IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'route_seq') THEN 
                            CREATE SEQUENCE route_seq START 1000 INCREMENT 1; 
                        END IF; 
                    END $$;
                ";
            context.Database.ExecuteSqlRaw(createSeqSql);
        }
    }
}