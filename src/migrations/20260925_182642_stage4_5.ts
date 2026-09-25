import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_search_type" AS ENUM('auto', 'service', 'company', 'industry', 'project', 'career', 'other', 'hidden');
  CREATE TYPE "public"."enum__pages_v_version_search_type" AS ENUM('auto', 'service', 'company', 'industry', 'project', 'career', 'other', 'hidden');
  CREATE TYPE "public"."enum_submissions_deliveries_channel" AS ENUM('email', 'bitrix24', 'friendwork');
  CREATE TYPE "public"."enum_submissions_deliveries_status" AS ENUM('pending', 'sent', 'retry', 'failed', 'skipped');
  CREATE TYPE "public"."enum_submissions_kind" AS ENUM('business', 'vacancy', 'quality', 'incident');
  CREATE TYPE "public"."enum_submissions_status" AS ENUM('new', 'progress', 'done', 'spam');
  CREATE TYPE "public"."enum_submissions_delivery_state" AS ENUM('pending', 'sent', 'failed');
  CREATE TYPE "public"."enum_redirects_code" AS ENUM('301', '302');
  CREATE TYPE "public"."enum_search_index_type" AS ENUM('news', 'article', 'journal', 'service', 'company', 'industry', 'project', 'career', 'other');
  CREATE TYPE "public"."enum_audit_log_action" AS ENUM('create', 'update', 'publish', 'unpublish', 'delete', 'login', 'logout', 'settings');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  CREATE TYPE "public"."enum_form_settings_bitrix24_kinds" AS ENUM('business', 'quality', 'incident');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'deliver-email' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'deliver-bitrix24' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'deliver-friendwork' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'cleanup-submissions' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'deliver-email' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'deliver-bitrix24' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'deliver-friendwork' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'cleanup-submissions' BEFORE 'schedulePublish';
  CREATE TABLE "submissions_fields" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar,
  	"name" varchar
  );
  
  CREATE TABLE "submissions_deliveries" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"channel" "enum_submissions_deliveries_channel",
  	"status" "enum_submissions_deliveries_status",
  	"attempts" numeric,
  	"at" timestamp(3) with time zone,
  	"target" varchar,
  	"error" varchar
  );
  
  CREATE TABLE "submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"kind" "enum_submissions_kind",
  	"status" "enum_submissions_status" DEFAULT 'new',
  	"delivery_state" "enum_submissions_delivery_state" DEFAULT 'pending',
  	"comment" varchar,
  	"form_id" integer,
  	"form_title" varchar,
  	"page" varchar,
  	"locale" varchar,
  	"utm" jsonb,
  	"recipients" varchar,
  	"captcha" varchar,
  	"ip_hash" varchar,
  	"search" varchar,
  	"data" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "submissions_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"submission_files_id" integer
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to" varchar NOT NULL,
  	"code" "enum_redirects_code" DEFAULT '301' NOT NULL,
  	"active" boolean DEFAULT true,
  	"auto" boolean DEFAULT false,
  	"note" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_index" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source" varchar,
  	"locale" varchar,
  	"type" "enum_search_index_type",
  	"title" varchar,
  	"text" varchar,
  	"url" varchar,
  	"tags" jsonb,
  	"date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_queries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"query" varchar,
  	"results" numeric,
  	"type" varchar,
  	"locale" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"summary" varchar,
  	"action" "enum_audit_log_action",
  	"user_email" varchar,
  	"ip" varchar,
  	"locale" varchar,
  	"target" varchar,
  	"changes" varchar,
  	"user_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "submission_files" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "form_settings_bitrix24_kinds" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_form_settings_bitrix24_kinds",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "form_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from_name" varchar DEFAULT 'Сайт jet.su',
  	"subject_prefix" varchar DEFAULT '[jet.su]',
  	"retention_days" numeric DEFAULT 90,
  	"max_file_mb" numeric DEFAULT 10,
  	"rate_limit_per_minute" numeric DEFAULT 3,
  	"rate_limit_per_hour" numeric DEFAULT 20,
  	"bitrix24_enabled" boolean DEFAULT false,
  	"bitrix24_drop_after_send" boolean DEFAULT false,
  	"friendwork_enabled" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "form_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "typograph_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"yo" boolean DEFAULT true,
  	"nb_hyphen" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "seo_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"indexing" boolean DEFAULT true,
  	"robots" varchar DEFAULT 'User-agent: *
  Disallow: /preview/
  Disallow: /api/
  Disallow: /*?*utm_
  Allow: /',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "seo_settings_texts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload_jobs_stats" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"stats" jsonb,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "forms" ALTER COLUMN "action" DROP DEFAULT;
  ALTER TABLE "pages" ADD COLUMN "search_type" "enum_pages_search_type" DEFAULT 'auto';
  ALTER TABLE "_pages_v" ADD COLUMN "version_search_type" "enum__pages_v_version_search_type" DEFAULT 'auto';
  ALTER TABLE "media" ADD COLUMN "folder_id" integer;
  ALTER TABLE "forms" ADD COLUMN "center_id" integer;
  ALTER TABLE "payload_jobs" ADD COLUMN "meta" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "submissions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "redirects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_index_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "search_queries_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "audit_log_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "submission_files_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "payload_folders_id" integer;
  ALTER TABLE "submissions_fields" ADD CONSTRAINT "submissions_fields_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_deliveries" ADD CONSTRAINT "submissions_deliveries_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions" ADD CONSTRAINT "submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "submissions_rels" ADD CONSTRAINT "submissions_rels_submission_files_fk" FOREIGN KEY ("submission_files_id") REFERENCES "public"."submission_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "form_settings_bitrix24_kinds" ADD CONSTRAINT "form_settings_bitrix24_kinds_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."form_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_settings_texts" ADD CONSTRAINT "form_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."form_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_settings_texts" ADD CONSTRAINT "seo_settings_texts_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."seo_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "submissions_fields_order_idx" ON "submissions_fields" USING btree ("_order");
  CREATE INDEX "submissions_fields_parent_id_idx" ON "submissions_fields" USING btree ("_parent_id");
  CREATE INDEX "submissions_deliveries_order_idx" ON "submissions_deliveries" USING btree ("_order");
  CREATE INDEX "submissions_deliveries_parent_id_idx" ON "submissions_deliveries" USING btree ("_parent_id");
  CREATE INDEX "submissions_kind_idx" ON "submissions" USING btree ("kind");
  CREATE INDEX "submissions_status_idx" ON "submissions" USING btree ("status");
  CREATE INDEX "submissions_form_idx" ON "submissions" USING btree ("form_id");
  CREATE INDEX "submissions_updated_at_idx" ON "submissions" USING btree ("updated_at");
  CREATE INDEX "submissions_created_at_idx" ON "submissions" USING btree ("created_at");
  CREATE INDEX "submissions_rels_order_idx" ON "submissions_rels" USING btree ("order");
  CREATE INDEX "submissions_rels_parent_idx" ON "submissions_rels" USING btree ("parent_id");
  CREATE INDEX "submissions_rels_path_idx" ON "submissions_rels" USING btree ("path");
  CREATE INDEX "submissions_rels_submission_files_id_idx" ON "submissions_rels" USING btree ("submission_files_id");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "search_index_source_idx" ON "search_index" USING btree ("source");
  CREATE INDEX "search_index_locale_idx" ON "search_index" USING btree ("locale");
  CREATE INDEX "search_index_type_idx" ON "search_index" USING btree ("type");
  CREATE INDEX "search_index_updated_at_idx" ON "search_index" USING btree ("updated_at");
  CREATE INDEX "search_index_created_at_idx" ON "search_index" USING btree ("created_at");
  CREATE INDEX "search_queries_query_idx" ON "search_queries" USING btree ("query");
  CREATE INDEX "search_queries_results_idx" ON "search_queries" USING btree ("results");
  CREATE INDEX "search_queries_updated_at_idx" ON "search_queries" USING btree ("updated_at");
  CREATE INDEX "search_queries_created_at_idx" ON "search_queries" USING btree ("created_at");
  CREATE INDEX "audit_log_action_idx" ON "audit_log" USING btree ("action");
  CREATE INDEX "audit_log_user_email_idx" ON "audit_log" USING btree ("user_email");
  CREATE INDEX "audit_log_target_idx" ON "audit_log" USING btree ("target");
  CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");
  CREATE INDEX "audit_log_updated_at_idx" ON "audit_log" USING btree ("updated_at");
  CREATE INDEX "audit_log_created_at_idx" ON "audit_log" USING btree ("created_at");
  CREATE INDEX "submission_files_updated_at_idx" ON "submission_files" USING btree ("updated_at");
  CREATE INDEX "submission_files_created_at_idx" ON "submission_files" USING btree ("created_at");
  CREATE UNIQUE INDEX "submission_files_filename_idx" ON "submission_files" USING btree ("filename");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "form_settings_bitrix24_kinds_order_idx" ON "form_settings_bitrix24_kinds" USING btree ("order");
  CREATE INDEX "form_settings_bitrix24_kinds_parent_idx" ON "form_settings_bitrix24_kinds" USING btree ("parent_id");
  CREATE INDEX "form_settings_texts_order_parent" ON "form_settings_texts" USING btree ("order","parent_id");
  CREATE INDEX "seo_settings_texts_order_parent" ON "seo_settings_texts" USING btree ("order","parent_id");
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "forms" ADD CONSTRAINT "forms_center_id_terms_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submissions_fk" FOREIGN KEY ("submissions_id") REFERENCES "public"."submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_index_fk" FOREIGN KEY ("search_index_id") REFERENCES "public"."search_index"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_queries_fk" FOREIGN KEY ("search_queries_id") REFERENCES "public"."search_queries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_log_fk" FOREIGN KEY ("audit_log_id") REFERENCES "public"."audit_log"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_submission_files_fk" FOREIGN KEY ("submission_files_id") REFERENCES "public"."submission_files"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "forms_center_idx" ON "forms" USING btree ("center_id");
  CREATE INDEX "payload_locked_documents_rels_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("submissions_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_search_index_id_idx" ON "payload_locked_documents_rels" USING btree ("search_index_id");
  CREATE INDEX "payload_locked_documents_rels_search_queries_id_idx" ON "payload_locked_documents_rels" USING btree ("search_queries_id");
  CREATE INDEX "payload_locked_documents_rels_audit_log_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_log_id");
  CREATE INDEX "payload_locked_documents_rels_submission_files_id_idx" ON "payload_locked_documents_rels" USING btree ("submission_files_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "submissions_fields" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions_deliveries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submissions_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "redirects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_index" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "search_queries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "audit_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "submission_files" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_folders_folder_type" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_folders" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_settings_bitrix24_kinds" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "form_settings_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "typograph_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seo_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "seo_settings_texts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_jobs_stats" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "submissions_fields" CASCADE;
  DROP TABLE "submissions_deliveries" CASCADE;
  DROP TABLE "submissions" CASCADE;
  DROP TABLE "submissions_rels" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "search_index" CASCADE;
  DROP TABLE "search_queries" CASCADE;
  DROP TABLE "audit_log" CASCADE;
  DROP TABLE "submission_files" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "form_settings_bitrix24_kinds" CASCADE;
  DROP TABLE "form_settings" CASCADE;
  DROP TABLE "form_settings_texts" CASCADE;
  DROP TABLE "typograph_settings" CASCADE;
  DROP TABLE "seo_settings" CASCADE;
  DROP TABLE "seo_settings_texts" CASCADE;
  DROP TABLE "payload_jobs_stats" CASCADE;
  ALTER TABLE "media" DROP CONSTRAINT "media_folder_id_payload_folders_id_fk";
  
  ALTER TABLE "forms" DROP CONSTRAINT "forms_center_id_terms_id_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_submissions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_redirects_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_search_index_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_search_queries_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_audit_log_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_submission_files_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_payload_folders_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "media_folder_idx";
  DROP INDEX "forms_center_idx";
  DROP INDEX "payload_locked_documents_rels_submissions_id_idx";
  DROP INDEX "payload_locked_documents_rels_redirects_id_idx";
  DROP INDEX "payload_locked_documents_rels_search_index_id_idx";
  DROP INDEX "payload_locked_documents_rels_search_queries_id_idx";
  DROP INDEX "payload_locked_documents_rels_audit_log_id_idx";
  DROP INDEX "payload_locked_documents_rels_submission_files_id_idx";
  DROP INDEX "payload_locked_documents_rels_payload_folders_id_idx";
  ALTER TABLE "forms" ALTER COLUMN "action" SET DEFAULT '/form/callback';
  ALTER TABLE "pages" DROP COLUMN "search_type";
  ALTER TABLE "_pages_v" DROP COLUMN "version_search_type";
  ALTER TABLE "media" DROP COLUMN "folder_id";
  ALTER TABLE "forms" DROP COLUMN "center_id";
  ALTER TABLE "payload_jobs" DROP COLUMN "meta";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "submissions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "redirects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "search_index_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "search_queries_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "audit_log_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "submission_files_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "payload_folders_id";
  DROP TYPE "public"."enum_pages_search_type";
  DROP TYPE "public"."enum__pages_v_version_search_type";
  DROP TYPE "public"."enum_submissions_deliveries_channel";
  DROP TYPE "public"."enum_submissions_deliveries_status";
  DROP TYPE "public"."enum_submissions_kind";
  DROP TYPE "public"."enum_submissions_status";
  DROP TYPE "public"."enum_submissions_delivery_state";
  DROP TYPE "public"."enum_redirects_code";
  DROP TYPE "public"."enum_search_index_type";
  DROP TYPE "public"."enum_audit_log_action";
  DROP TYPE "public"."enum_payload_folders_folder_type";
  DROP TYPE "public"."enum_form_settings_bitrix24_kinds";`)
}
