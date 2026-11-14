BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Restaurant] ALTER COLUMN [createdBy] UNIQUEIDENTIFIER NULL;
ALTER TABLE [dbo].[Restaurant] ADD [catalogActive] BIT NOT NULL CONSTRAINT [Restaurant_catalogActive_df] DEFAULT 0,
[catalogArea] VARCHAR(30),
[dietVegan] VARCHAR(10) NOT NULL CONSTRAINT [Restaurant_dietVegan_df] DEFAULT 'unknown',
[dietVegetarian] VARCHAR(10) NOT NULL CONSTRAINT [Restaurant_dietVegetarian_df] DEFAULT 'unknown',
[importedAt] DATETIME2,
[osmId] VARCHAR(20),
[osmType] VARCHAR(10),
[osmUpdatedAt] DATETIME2,
[osmVersion] INT,
[priceCurrency] VARCHAR(3) NOT NULL CONSTRAINT [Restaurant_priceCurrency_df] DEFAULT 'RUB',
[priceFetchedAt] DATETIME2,
[priceMatchDistance] FLOAT(53),
[priceSource] NVARCHAR(1000),
[priceSourceId] VARCHAR(50),
[rawTags] NVARCHAR(max);

-- CreateTable
CREATE TABLE [dbo].[RestaurantCuisine] (
    [restaurantId] UNIQUEIDENTIFIER NOT NULL,
    [code] VARCHAR(50) NOT NULL,
    CONSTRAINT [RestaurantCuisine_pkey] PRIMARY KEY CLUSTERED ([restaurantId],[code])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [RestaurantCuisine_code_restaurantId_idx] ON [dbo].[RestaurantCuisine]([code], [restaurantId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Restaurant_catalogArea_catalogActive_price_idx] ON [dbo].[Restaurant]([catalogArea], [catalogActive], [price]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Restaurant_catalogArea_latitude_longitude_idx] ON [dbo].[Restaurant]([catalogArea], [latitude], [longitude]);

-- AddForeignKey
ALTER TABLE [dbo].[RestaurantCuisine] ADD CONSTRAINT [RestaurantCuisine_restaurantId_fkey] FOREIGN KEY ([restaurantId]) REFERENCES [dbo].[Restaurant]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
