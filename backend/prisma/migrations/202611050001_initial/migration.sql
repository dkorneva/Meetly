BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [email] NVARCHAR(254) NOT NULL,
    [name] NVARCHAR(30) NOT NULL,
    [passwordHash] VARCHAR(255) NOT NULL,
    [avatarId] UNIQUEIDENTIFIER,
    [reminders] BIT NOT NULL CONSTRAINT [User_reminders_df] DEFAULT 0,
    [dark] BIT NOT NULL CONSTRAINT [User_dark_df] DEFAULT 0,
    [calendar] BIT NOT NULL CONSTRAINT [User_calendar_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [tokenHash] VARCHAR(64) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Session_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

-- CreateTable
CREATE TABLE [dbo].[Meeting] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ownerId] UNIQUEIDENTIFIER NOT NULL,
    [title] NVARCHAR(100) NOT NULL,
    [startsAt] DATETIME2 NOT NULL,
    [status] VARCHAR(20) NOT NULL CONSTRAINT [Meeting_status_df] DEFAULT 'voting',
    [restaurantId] UNIQUEIDENTIFIER,
    [bookedAt] DATETIME2,
    [completedAt] DATETIME2,
    [district] NVARCHAR(100) NOT NULL,
    [city] NVARCHAR(100) NOT NULL CONSTRAINT [Meeting_city_df] DEFAULT 'Москва',
    [format] NVARCHAR(30) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Meeting_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [version] INT NOT NULL CONSTRAINT [Meeting_version_df] DEFAULT 0,
    CONSTRAINT [Meeting_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Member] (
    [meetingId] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [budget] INT NOT NULL CONSTRAINT [Member_budget_df] DEFAULT 1500,
    [cuisines] NVARCHAR(2000) NOT NULL CONSTRAINT [Member_cuisines_df] DEFAULT '[]',
    CONSTRAINT [Member_pkey] PRIMARY KEY CLUSTERED ([meetingId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Restaurant] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [sourceId] VARCHAR(100) NOT NULL,
    [source] VARCHAR(20) NOT NULL CONSTRAINT [Restaurant_source_df] DEFAULT 'user',
    [openingHours] NVARCHAR(500) NOT NULL CONSTRAINT [Restaurant_openingHours_df] DEFAULT '',
    [name] NVARCHAR(150) NOT NULL,
    [address] NVARCHAR(500) NOT NULL,
    [city] NVARCHAR(100) NOT NULL,
    [district] NVARCHAR(100) NOT NULL,
    [latitude] FLOAT(53) NOT NULL,
    [longitude] FLOAT(53) NOT NULL,
    [cuisine] NVARCHAR(150) NOT NULL,
    [price] INT,
    [phone] NVARCHAR(50) NOT NULL CONSTRAINT [Restaurant_phone_df] DEFAULT '',
    [website] NVARCHAR(1000) NOT NULL CONSTRAINT [Restaurant_website_df] DEFAULT '',
    [outdoor] BIT NOT NULL CONSTRAINT [Restaurant_outdoor_df] DEFAULT 0,
    [createdBy] UNIQUEIDENTIFIER NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Restaurant_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Restaurant_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Restaurant_sourceId_key] UNIQUE NONCLUSTERED ([sourceId])
);

-- CreateTable
CREATE TABLE [dbo].[Candidate] (
    [meetingId] UNIQUEIDENTIFIER NOT NULL,
    [restaurantId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [Candidate_pkey] PRIMARY KEY CLUSTERED ([meetingId],[restaurantId])
);

-- CreateTable
CREATE TABLE [dbo].[Vote] (
    [meetingId] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER NOT NULL,
    [restaurantId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [Vote_pkey] PRIMARY KEY CLUSTERED ([meetingId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Message] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [meetingId] UNIQUEIDENTIFIER NOT NULL,
    [senderId] UNIQUEIDENTIFIER NOT NULL,
    [text] NVARCHAR(4000) NOT NULL,
    [fileId] UNIQUEIDENTIFIER,
    [kind] VARCHAR(20) NOT NULL CONSTRAINT [Message_kind_df] DEFAULT 'text',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Message_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Message_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Reaction] (
    [messageId] UNIQUEIDENTIFIER NOT NULL,
    [userId] UNIQUEIDENTIFIER NOT NULL,
    CONSTRAINT [Reaction_pkey] PRIMARY KEY CLUSTERED ([messageId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Invitation] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [meetingId] UNIQUEIDENTIFIER NOT NULL,
    [tokenHash] VARCHAR(64) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [revoked] BIT NOT NULL CONSTRAINT [Invitation_revoked_df] DEFAULT 0,
    CONSTRAINT [Invitation_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Invitation_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

-- CreateTable
CREATE TABLE [dbo].[File] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [ownerId] UNIQUEIDENTIFIER NOT NULL,
    [meetingId] UNIQUEIDENTIFIER,
    [name] NVARCHAR(255) NOT NULL,
    [mime] VARCHAR(100) NOT NULL,
    [data] VARBINARY(max) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [File_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [File_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Session_userId_idx] ON [dbo].[Session]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Meeting_ownerId_idx] ON [dbo].[Meeting]([ownerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Meeting_startsAt_idx] ON [dbo].[Meeting]([startsAt]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Member_userId_idx] ON [dbo].[Member]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Restaurant_city_district_idx] ON [dbo].[Restaurant]([city], [district]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Message_meetingId_createdAt_id_idx] ON [dbo].[Message]([meetingId], [createdAt], [id]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [File_ownerId_idx] ON [dbo].[File]([ownerId]);

-- AddForeignKey
ALTER TABLE [dbo].[Session] ADD CONSTRAINT [Session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Member] ADD CONSTRAINT [Member_meetingId_fkey] FOREIGN KEY ([meetingId]) REFERENCES [dbo].[Meeting]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Member] ADD CONSTRAINT [Member_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Candidate] ADD CONSTRAINT [Candidate_meetingId_fkey] FOREIGN KEY ([meetingId]) REFERENCES [dbo].[Meeting]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Candidate] ADD CONSTRAINT [Candidate_restaurantId_fkey] FOREIGN KEY ([restaurantId]) REFERENCES [dbo].[Restaurant]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Vote] ADD CONSTRAINT [Vote_meetingId_restaurantId_fkey] FOREIGN KEY ([meetingId], [restaurantId]) REFERENCES [dbo].[Candidate]([meetingId],[restaurantId]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Message] ADD CONSTRAINT [Message_meetingId_fkey] FOREIGN KEY ([meetingId]) REFERENCES [dbo].[Meeting]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Reaction] ADD CONSTRAINT [Reaction_messageId_fkey] FOREIGN KEY ([messageId]) REFERENCES [dbo].[Message]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Invitation] ADD CONSTRAINT [Invitation_meetingId_fkey] FOREIGN KEY ([meetingId]) REFERENCES [dbo].[Meeting]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
