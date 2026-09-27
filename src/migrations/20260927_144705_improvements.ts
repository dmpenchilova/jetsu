import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_layout" AS ENUM('default', 'landing');
  CREATE TYPE "public"."enum_pages_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum_pages_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum__pages_v_version_layout" AS ENUM('default', 'landing');
  CREATE TYPE "public"."enum__pages_v_version_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum__pages_v_version_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum_publications_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum_publications_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum__publications_v_version_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum__publications_v_version_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum_projects_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum_projects_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum__projects_v_version_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum__projects_v_version_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum_events_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum_events_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum__events_v_version_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum__events_v_version_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum_vacancies_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum_vacancies_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum__vacancies_v_version_translation_status" AS ENUM('none', 'outdated', 'ok');
  CREATE TYPE "public"."enum__vacancies_v_version_review_status" AS ENUM('none', 'review', 'changes', 'approved');
  CREATE TYPE "public"."enum_polls_show_results" AS ENUM('after', 'never');
  CREATE TYPE "public"."enum_vulnerabilities_state" AS ENUM('active', 'fixed');
  CREATE TYPE "public"."enum_vulnerabilities_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__vulnerabilities_v_version_state" AS ENUM('active', 'fixed');
  CREATE TYPE "public"."enum__vulnerabilities_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__vulnerabilities_v_published_locale" AS ENUM('ru', 'en');
  ALTER TYPE "public"."enum_forms_visible_type" ADD VALUE 'select';
  ALTER TYPE "public"."enum_forms_visible_type" ADD VALUE 'checkboxes';
  ALTER TYPE "public"."enum_forms_visible_type" ADD VALUE 'date';
  ALTER TYPE "public"."enum_forms_visible_type" ADD VALUE 'step';
  ALTER TYPE "public"."enum_forms_hidden_type" ADD VALUE 'select';
  ALTER TYPE "public"."enum_forms_hidden_type" ADD VALUE 'checkboxes';
  ALTER TYPE "public"."enum_forms_hidden_type" ADD VALUE 'date';
  ALTER TYPE "public"."enum_forms_hidden_type" ADD VALUE 'step';
  ALTER TYPE "public"."enum_search_index_type" ADD VALUE 'vuln' BEFORE 'other';
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'revalidate-scheduled-blocks' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'revalidate-scheduled-blocks' BEFORE 'schedulePublish';
  CREATE TABLE "pages_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"directions_id" integer,
  	"industries_id" integer
  );
  
  CREATE TABLE "_pages_v_version_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"directions_id" integer,
  	"industries_id" integer
  );
  
  CREATE TABLE "page_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "page_templates_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "shared_blocks" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "shared_blocks_locales" (
  	"content" jsonb,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "publications_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "_publications_v_version_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "projects_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "_projects_v_version_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "events_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "_events_v_version_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "vacancies_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar
  );
  
  CREATE TABLE "_vacancies_v_version_review_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"at" timestamp(3) with time zone,
  	"user" varchar,
  	"action" varchar,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "people" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"photo_src_id" integer,
  	"photo_alt" varchar,
  	"photo_tablet_id" integer,
  	"photo_desktop_id" integer,
  	"email" varchar,
  	"phone" varchar,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "people_locales" (
  	"name" varchar NOT NULL,
  	"position" varchar,
  	"department" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "clients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_light_id" integer,
  	"logo_dark_id" integer,
  	"url" varchar,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "clients_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "awards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" numeric,
  	"url" varchar,
  	"img_src_id" integer,
  	"img_alt" varchar,
  	"img_tablet_id" integer,
  	"img_desktop_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "awards_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "polls_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "polls_options_locales" (
  	"label" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "polls" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"multiple" boolean,
  	"active" boolean DEFAULT true,
  	"until" timestamp(3) with time zone,
  	"show_results" "enum_polls_show_results" DEFAULT 'after',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "polls_locales" (
  	"question" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "poll_votes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"poll_id" integer,
  	"options" jsonb,
  	"voter" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "vulnerabilities" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"cve" varchar,
  	"date" timestamp(3) with time zone,
  	"state" "enum_vulnerabilities_state" DEFAULT 'active',
  	"vendor" varchar,
  	"cvss3" numeric,
  	"vector3" varchar,
  	"cvss2" numeric,
  	"vector2" varchar,
  	"links_press" varchar,
  	"links_github" varchar,
  	"links_mitre" varchar,
  	"links_bdu" varchar,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_vulnerabilities_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "vulnerabilities_locales" (
  	"title" varchar,
  	"product" varchar,
  	"description" varchar,
  	"fix" varchar,
  	"workaround" varchar,
  	"found_by" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_keywords" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_vulnerabilities_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_cve" varchar,
  	"version_date" timestamp(3) with time zone,
  	"version_state" "enum__vulnerabilities_v_version_state" DEFAULT 'active',
  	"version_vendor" varchar,
  	"version_cvss3" numeric,
  	"version_vector3" varchar,
  	"version_cvss2" numeric,
  	"version_vector2" varchar,
  	"version_links_press" varchar,
  	"version_links_github" varchar,
  	"version_links_mitre" varchar,
  	"version_links_bdu" varchar,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__vulnerabilities_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__vulnerabilities_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_vulnerabilities_v_locales" (
  	"version_title" varchar,
  	"version_product" varchar,
  	"version_description" varchar,
  	"version_fix" varchar,
  	"version_workaround" varchar,
  	"version_found_by" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_keywords" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "media_locales" (
  	"alt" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "forms_visible_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "forms_hidden_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"value" varchar
  );
  
  CREATE TABLE "not_found_log" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"path" varchar,
  	"hits" numeric DEFAULT 0,
  	"last_seen" timestamp(3) with time zone,
  	"fixed" boolean,
  	"referrer" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_variables_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"note" varchar
  );
  
  CREATE TABLE "site_variables_items_locales" (
  	"value" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" varchar NOT NULL
  );
  
  CREATE TABLE "site_variables" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "maintenance" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean,
  	"until" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "maintenance_locales" (
  	"title" varchar DEFAULT 'На сайте ведутся технические работы',
  	"text" varchar DEFAULT 'Сайт скоро снова заработает. Спасибо за терпение!',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "forms_visible" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "forms_hidden" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "pages" ADD COLUMN "layout" "enum_pages_layout" DEFAULT 'default';
  ALTER TABLE "pages" ADD COLUMN "translation_status" "enum_pages_translation_status" DEFAULT 'none';
  ALTER TABLE "pages" ADD COLUMN "ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "pages" ADD COLUMN "en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "pages" ADD COLUMN "review_status" "enum_pages_review_status" DEFAULT 'none';
  ALTER TABLE "_pages_v" ADD COLUMN "version_layout" "enum__pages_v_version_layout" DEFAULT 'default';
  ALTER TABLE "_pages_v" ADD COLUMN "version_translation_status" "enum__pages_v_version_translation_status" DEFAULT 'none';
  ALTER TABLE "_pages_v" ADD COLUMN "version_ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_pages_v" ADD COLUMN "version_review_status" "enum__pages_v_version_review_status" DEFAULT 'none';
  ALTER TABLE "publications" ADD COLUMN "translation_status" "enum_publications_translation_status" DEFAULT 'none';
  ALTER TABLE "publications" ADD COLUMN "ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "publications" ADD COLUMN "en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "publications" ADD COLUMN "review_status" "enum_publications_review_status" DEFAULT 'none';
  ALTER TABLE "_publications_v" ADD COLUMN "version_translation_status" "enum__publications_v_version_translation_status" DEFAULT 'none';
  ALTER TABLE "_publications_v" ADD COLUMN "version_ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_publications_v" ADD COLUMN "version_en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_publications_v" ADD COLUMN "version_review_status" "enum__publications_v_version_review_status" DEFAULT 'none';
  ALTER TABLE "projects" ADD COLUMN "translation_status" "enum_projects_translation_status" DEFAULT 'none';
  ALTER TABLE "projects" ADD COLUMN "ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "projects" ADD COLUMN "review_status" "enum_projects_review_status" DEFAULT 'none';
  ALTER TABLE "_projects_v" ADD COLUMN "version_translation_status" "enum__projects_v_version_translation_status" DEFAULT 'none';
  ALTER TABLE "_projects_v" ADD COLUMN "version_ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_projects_v" ADD COLUMN "version_review_status" "enum__projects_v_version_review_status" DEFAULT 'none';
  ALTER TABLE "events" ADD COLUMN "translation_status" "enum_events_translation_status" DEFAULT 'none';
  ALTER TABLE "events" ADD COLUMN "ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "events" ADD COLUMN "review_status" "enum_events_review_status" DEFAULT 'none';
  ALTER TABLE "_events_v" ADD COLUMN "version_translation_status" "enum__events_v_version_translation_status" DEFAULT 'none';
  ALTER TABLE "_events_v" ADD COLUMN "version_ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_events_v" ADD COLUMN "version_en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_events_v" ADD COLUMN "version_review_status" "enum__events_v_version_review_status" DEFAULT 'none';
  ALTER TABLE "vacancies" ADD COLUMN "translation_status" "enum_vacancies_translation_status" DEFAULT 'none';
  ALTER TABLE "vacancies" ADD COLUMN "ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "vacancies" ADD COLUMN "en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "vacancies" ADD COLUMN "review_status" "enum_vacancies_review_status" DEFAULT 'none';
  ALTER TABLE "_vacancies_v" ADD COLUMN "version_translation_status" "enum__vacancies_v_version_translation_status" DEFAULT 'none';
  ALTER TABLE "_vacancies_v" ADD COLUMN "version_ru_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_vacancies_v" ADD COLUMN "version_en_edited_at" timestamp(3) with time zone;
  ALTER TABLE "_vacancies_v" ADD COLUMN "version_review_status" "enum__vacancies_v_version_review_status" DEFAULT 'none';
  ALTER TABLE "media" ADD COLUMN "hash" varchar;
  ALTER TABLE "forms_visible" ADD COLUMN "show_if_name" varchar;
  ALTER TABLE "forms_visible" ADD COLUMN "show_if_value" varchar;
  ALTER TABLE "forms_hidden" ADD COLUMN "show_if_name" varchar;
  ALTER TABLE "forms_hidden" ADD COLUMN "show_if_value" varchar;
  ALTER TABLE "forms_locales" ADD COLUMN "success_title" varchar;
  ALTER TABLE "forms_locales" ADD COLUMN "success_text" varchar;
  ALTER TABLE "users" ADD COLUMN "totp_enabled" boolean DEFAULT false;
  ALTER TABLE "users" ADD COLUMN "totp_secret" varchar;
  ALTER TABLE "users" ADD COLUMN "totp_pending" varchar;
  ALTER TABLE "users" ADD COLUMN "totp_last_step" numeric;
  ALTER TABLE "users" ADD COLUMN "totp_recovery" jsonb;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "page_templates_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "shared_blocks_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "people_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "clients_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "awards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "polls_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "poll_votes_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vulnerabilities_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "not_found_log_id" integer;
  ALTER TABLE "pages_review_log" ADD CONSTRAINT "pages_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_directions_fk" FOREIGN KEY ("directions_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_review_log" ADD CONSTRAINT "_pages_v_version_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_directions_fk" FOREIGN KEY ("directions_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "page_templates_locales" ADD CONSTRAINT "page_templates_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."page_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "shared_blocks_locales" ADD CONSTRAINT "shared_blocks_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shared_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_review_log" ADD CONSTRAINT "publications_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_version_review_log" ADD CONSTRAINT "_publications_v_version_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_publications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_review_log" ADD CONSTRAINT "projects_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_review_log" ADD CONSTRAINT "_projects_v_version_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "events_review_log" ADD CONSTRAINT "events_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_events_v_version_review_log" ADD CONSTRAINT "_events_v_version_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_events_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_review_log" ADD CONSTRAINT "vacancies_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_review_log" ADD CONSTRAINT "_vacancies_v_version_review_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_photo_src_id_media_id_fk" FOREIGN KEY ("photo_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_photo_tablet_id_media_id_fk" FOREIGN KEY ("photo_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people" ADD CONSTRAINT "people_photo_desktop_id_media_id_fk" FOREIGN KEY ("photo_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "people_locales" ADD CONSTRAINT "people_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "clients" ADD CONSTRAINT "clients_logo_light_id_media_id_fk" FOREIGN KEY ("logo_light_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clients" ADD CONSTRAINT "clients_logo_dark_id_media_id_fk" FOREIGN KEY ("logo_dark_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "clients_locales" ADD CONSTRAINT "clients_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "awards" ADD CONSTRAINT "awards_img_src_id_media_id_fk" FOREIGN KEY ("img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "awards" ADD CONSTRAINT "awards_img_tablet_id_media_id_fk" FOREIGN KEY ("img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "awards" ADD CONSTRAINT "awards_img_desktop_id_media_id_fk" FOREIGN KEY ("img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "awards_locales" ADD CONSTRAINT "awards_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "polls_options" ADD CONSTRAINT "polls_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "polls_options_locales" ADD CONSTRAINT "polls_options_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."polls_options"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "polls_locales" ADD CONSTRAINT "polls_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vulnerabilities_locales" ADD CONSTRAINT "vulnerabilities_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vulnerabilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vulnerabilities_v" ADD CONSTRAINT "_vulnerabilities_v_parent_id_vulnerabilities_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vulnerabilities"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vulnerabilities_v_locales" ADD CONSTRAINT "_vulnerabilities_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vulnerabilities_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media_locales" ADD CONSTRAINT "media_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_visible_options" ADD CONSTRAINT "forms_visible_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_visible"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_hidden_options" ADD CONSTRAINT "forms_hidden_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_hidden"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_variables_items" ADD CONSTRAINT "site_variables_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_variables"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_variables_items_locales" ADD CONSTRAINT "site_variables_items_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_variables_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "maintenance_locales" ADD CONSTRAINT "maintenance_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."maintenance"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_review_log_order_idx" ON "pages_review_log" USING btree ("_order");
  CREATE INDEX "pages_review_log_parent_id_idx" ON "pages_review_log" USING btree ("_parent_id");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_directions_id_idx" ON "pages_rels" USING btree ("directions_id");
  CREATE INDEX "pages_rels_industries_id_idx" ON "pages_rels" USING btree ("industries_id");
  CREATE INDEX "_pages_v_version_review_log_order_idx" ON "_pages_v_version_review_log" USING btree ("_order");
  CREATE INDEX "_pages_v_version_review_log_parent_id_idx" ON "_pages_v_version_review_log" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_directions_id_idx" ON "_pages_v_rels" USING btree ("directions_id");
  CREATE INDEX "_pages_v_rels_industries_id_idx" ON "_pages_v_rels" USING btree ("industries_id");
  CREATE INDEX "page_templates_updated_at_idx" ON "page_templates" USING btree ("updated_at");
  CREATE INDEX "page_templates_created_at_idx" ON "page_templates" USING btree ("created_at");
  CREATE UNIQUE INDEX "page_templates_locales_locale_parent_id_unique" ON "page_templates_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "shared_blocks_updated_at_idx" ON "shared_blocks" USING btree ("updated_at");
  CREATE INDEX "shared_blocks_created_at_idx" ON "shared_blocks" USING btree ("created_at");
  CREATE UNIQUE INDEX "shared_blocks_locales_locale_parent_id_unique" ON "shared_blocks_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "publications_review_log_order_idx" ON "publications_review_log" USING btree ("_order");
  CREATE INDEX "publications_review_log_parent_id_idx" ON "publications_review_log" USING btree ("_parent_id");
  CREATE INDEX "_publications_v_version_review_log_order_idx" ON "_publications_v_version_review_log" USING btree ("_order");
  CREATE INDEX "_publications_v_version_review_log_parent_id_idx" ON "_publications_v_version_review_log" USING btree ("_parent_id");
  CREATE INDEX "projects_review_log_order_idx" ON "projects_review_log" USING btree ("_order");
  CREATE INDEX "projects_review_log_parent_id_idx" ON "projects_review_log" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_review_log_order_idx" ON "_projects_v_version_review_log" USING btree ("_order");
  CREATE INDEX "_projects_v_version_review_log_parent_id_idx" ON "_projects_v_version_review_log" USING btree ("_parent_id");
  CREATE INDEX "events_review_log_order_idx" ON "events_review_log" USING btree ("_order");
  CREATE INDEX "events_review_log_parent_id_idx" ON "events_review_log" USING btree ("_parent_id");
  CREATE INDEX "_events_v_version_review_log_order_idx" ON "_events_v_version_review_log" USING btree ("_order");
  CREATE INDEX "_events_v_version_review_log_parent_id_idx" ON "_events_v_version_review_log" USING btree ("_parent_id");
  CREATE INDEX "vacancies_review_log_order_idx" ON "vacancies_review_log" USING btree ("_order");
  CREATE INDEX "vacancies_review_log_parent_id_idx" ON "vacancies_review_log" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_review_log_order_idx" ON "_vacancies_v_version_review_log" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_review_log_parent_id_idx" ON "_vacancies_v_version_review_log" USING btree ("_parent_id");
  CREATE INDEX "people_photo_photo_src_idx" ON "people" USING btree ("photo_src_id");
  CREATE INDEX "people_photo_photo_tablet_idx" ON "people" USING btree ("photo_tablet_id");
  CREATE INDEX "people_photo_photo_desktop_idx" ON "people" USING btree ("photo_desktop_id");
  CREATE INDEX "people_updated_at_idx" ON "people" USING btree ("updated_at");
  CREATE INDEX "people_created_at_idx" ON "people" USING btree ("created_at");
  CREATE UNIQUE INDEX "people_locales_locale_parent_id_unique" ON "people_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "clients_logo_light_idx" ON "clients" USING btree ("logo_light_id");
  CREATE INDEX "clients_logo_dark_idx" ON "clients" USING btree ("logo_dark_id");
  CREATE INDEX "clients_updated_at_idx" ON "clients" USING btree ("updated_at");
  CREATE INDEX "clients_created_at_idx" ON "clients" USING btree ("created_at");
  CREATE UNIQUE INDEX "clients_locales_locale_parent_id_unique" ON "clients_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "awards_img_img_src_idx" ON "awards" USING btree ("img_src_id");
  CREATE INDEX "awards_img_img_tablet_idx" ON "awards" USING btree ("img_tablet_id");
  CREATE INDEX "awards_img_img_desktop_idx" ON "awards" USING btree ("img_desktop_id");
  CREATE INDEX "awards_updated_at_idx" ON "awards" USING btree ("updated_at");
  CREATE INDEX "awards_created_at_idx" ON "awards" USING btree ("created_at");
  CREATE UNIQUE INDEX "awards_locales_locale_parent_id_unique" ON "awards_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "polls_options_order_idx" ON "polls_options" USING btree ("_order");
  CREATE INDEX "polls_options_parent_id_idx" ON "polls_options" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "polls_options_locales_locale_parent_id_unique" ON "polls_options_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "polls_updated_at_idx" ON "polls" USING btree ("updated_at");
  CREATE INDEX "polls_created_at_idx" ON "polls" USING btree ("created_at");
  CREATE UNIQUE INDEX "polls_locales_locale_parent_id_unique" ON "polls_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "poll_votes_poll_idx" ON "poll_votes" USING btree ("poll_id");
  CREATE INDEX "poll_votes_voter_idx" ON "poll_votes" USING btree ("voter");
  CREATE INDEX "poll_votes_updated_at_idx" ON "poll_votes" USING btree ("updated_at");
  CREATE INDEX "poll_votes_created_at_idx" ON "poll_votes" USING btree ("created_at");
  CREATE UNIQUE INDEX "vulnerabilities_slug_idx" ON "vulnerabilities" USING btree ("slug");
  CREATE INDEX "vulnerabilities_updated_at_idx" ON "vulnerabilities" USING btree ("updated_at");
  CREATE INDEX "vulnerabilities_created_at_idx" ON "vulnerabilities" USING btree ("created_at");
  CREATE INDEX "vulnerabilities__status_idx" ON "vulnerabilities" USING btree ("_status");
  CREATE UNIQUE INDEX "vulnerabilities_locales_locale_parent_id_unique" ON "vulnerabilities_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_vulnerabilities_v_parent_idx" ON "_vulnerabilities_v" USING btree ("parent_id");
  CREATE INDEX "_vulnerabilities_v_version_version_slug_idx" ON "_vulnerabilities_v" USING btree ("version_slug");
  CREATE INDEX "_vulnerabilities_v_version_version_updated_at_idx" ON "_vulnerabilities_v" USING btree ("version_updated_at");
  CREATE INDEX "_vulnerabilities_v_version_version_created_at_idx" ON "_vulnerabilities_v" USING btree ("version_created_at");
  CREATE INDEX "_vulnerabilities_v_version_version__status_idx" ON "_vulnerabilities_v" USING btree ("version__status");
  CREATE INDEX "_vulnerabilities_v_created_at_idx" ON "_vulnerabilities_v" USING btree ("created_at");
  CREATE INDEX "_vulnerabilities_v_updated_at_idx" ON "_vulnerabilities_v" USING btree ("updated_at");
  CREATE INDEX "_vulnerabilities_v_snapshot_idx" ON "_vulnerabilities_v" USING btree ("snapshot");
  CREATE INDEX "_vulnerabilities_v_published_locale_idx" ON "_vulnerabilities_v" USING btree ("published_locale");
  CREATE INDEX "_vulnerabilities_v_latest_idx" ON "_vulnerabilities_v" USING btree ("latest");
  CREATE INDEX "_vulnerabilities_v_autosave_idx" ON "_vulnerabilities_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_vulnerabilities_v_locales_locale_parent_id_unique" ON "_vulnerabilities_v_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "media_locales_locale_parent_id_unique" ON "media_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "forms_visible_options_order_idx" ON "forms_visible_options" USING btree ("_order");
  CREATE INDEX "forms_visible_options_parent_id_idx" ON "forms_visible_options" USING btree ("_parent_id");
  CREATE INDEX "forms_visible_options_locale_idx" ON "forms_visible_options" USING btree ("_locale");
  CREATE INDEX "forms_hidden_options_order_idx" ON "forms_hidden_options" USING btree ("_order");
  CREATE INDEX "forms_hidden_options_parent_id_idx" ON "forms_hidden_options" USING btree ("_parent_id");
  CREATE INDEX "forms_hidden_options_locale_idx" ON "forms_hidden_options" USING btree ("_locale");
  CREATE UNIQUE INDEX "not_found_log_path_idx" ON "not_found_log" USING btree ("path");
  CREATE INDEX "not_found_log_hits_idx" ON "not_found_log" USING btree ("hits");
  CREATE INDEX "not_found_log_last_seen_idx" ON "not_found_log" USING btree ("last_seen");
  CREATE INDEX "not_found_log_updated_at_idx" ON "not_found_log" USING btree ("updated_at");
  CREATE INDEX "not_found_log_created_at_idx" ON "not_found_log" USING btree ("created_at");
  CREATE INDEX "site_variables_items_order_idx" ON "site_variables_items" USING btree ("_order");
  CREATE INDEX "site_variables_items_parent_id_idx" ON "site_variables_items" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "site_variables_items_locales_locale_parent_id_unique" ON "site_variables_items_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "maintenance_locales_locale_parent_id_unique" ON "maintenance_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_page_templates_fk" FOREIGN KEY ("page_templates_id") REFERENCES "public"."page_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_shared_blocks_fk" FOREIGN KEY ("shared_blocks_id") REFERENCES "public"."shared_blocks"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_people_fk" FOREIGN KEY ("people_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_awards_fk" FOREIGN KEY ("awards_id") REFERENCES "public"."awards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_polls_fk" FOREIGN KEY ("polls_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_poll_votes_fk" FOREIGN KEY ("poll_votes_id") REFERENCES "public"."poll_votes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vulnerabilities_fk" FOREIGN KEY ("vulnerabilities_id") REFERENCES "public"."vulnerabilities"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_not_found_log_fk" FOREIGN KEY ("not_found_log_id") REFERENCES "public"."not_found_log"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_translation_status_idx" ON "pages" USING btree ("translation_status");
  CREATE INDEX "pages_review_status_idx" ON "pages" USING btree ("review_status");
  CREATE INDEX "_pages_v_version_version_translation_status_idx" ON "_pages_v" USING btree ("version_translation_status");
  CREATE INDEX "_pages_v_version_version_review_status_idx" ON "_pages_v" USING btree ("version_review_status");
  CREATE INDEX "publications_translation_status_idx" ON "publications" USING btree ("translation_status");
  CREATE INDEX "publications_review_status_idx" ON "publications" USING btree ("review_status");
  CREATE INDEX "_publications_v_version_version_translation_status_idx" ON "_publications_v" USING btree ("version_translation_status");
  CREATE INDEX "_publications_v_version_version_review_status_idx" ON "_publications_v" USING btree ("version_review_status");
  CREATE INDEX "projects_translation_status_idx" ON "projects" USING btree ("translation_status");
  CREATE INDEX "projects_review_status_idx" ON "projects" USING btree ("review_status");
  CREATE INDEX "_projects_v_version_version_translation_status_idx" ON "_projects_v" USING btree ("version_translation_status");
  CREATE INDEX "_projects_v_version_version_review_status_idx" ON "_projects_v" USING btree ("version_review_status");
  CREATE INDEX "events_translation_status_idx" ON "events" USING btree ("translation_status");
  CREATE INDEX "events_review_status_idx" ON "events" USING btree ("review_status");
  CREATE INDEX "_events_v_version_version_translation_status_idx" ON "_events_v" USING btree ("version_translation_status");
  CREATE INDEX "_events_v_version_version_review_status_idx" ON "_events_v" USING btree ("version_review_status");
  CREATE INDEX "vacancies_translation_status_idx" ON "vacancies" USING btree ("translation_status");
  CREATE INDEX "vacancies_review_status_idx" ON "vacancies" USING btree ("review_status");
  CREATE INDEX "_vacancies_v_version_version_translation_status_idx" ON "_vacancies_v" USING btree ("version_translation_status");
  CREATE INDEX "_vacancies_v_version_version_review_status_idx" ON "_vacancies_v" USING btree ("version_review_status");
  CREATE INDEX "media_hash_idx" ON "media" USING btree ("hash");
  CREATE INDEX "payload_locked_documents_rels_page_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("page_templates_id");
  CREATE INDEX "payload_locked_documents_rels_shared_blocks_id_idx" ON "payload_locked_documents_rels" USING btree ("shared_blocks_id");
  CREATE INDEX "payload_locked_documents_rels_people_id_idx" ON "payload_locked_documents_rels" USING btree ("people_id");
  CREATE INDEX "payload_locked_documents_rels_clients_id_idx" ON "payload_locked_documents_rels" USING btree ("clients_id");
  CREATE INDEX "payload_locked_documents_rels_awards_id_idx" ON "payload_locked_documents_rels" USING btree ("awards_id");
  CREATE INDEX "payload_locked_documents_rels_polls_id_idx" ON "payload_locked_documents_rels" USING btree ("polls_id");
  CREATE INDEX "payload_locked_documents_rels_poll_votes_id_idx" ON "payload_locked_documents_rels" USING btree ("poll_votes_id");
  CREATE INDEX "payload_locked_documents_rels_vulnerabilities_id_idx" ON "payload_locked_documents_rels" USING btree ("vulnerabilities_id");
  CREATE INDEX "payload_locked_documents_rels_not_found_log_id_idx" ON "payload_locked_documents_rels" USING btree ("not_found_log_id");
  -- alt у файлов становится своим для каждого языка: прежний alt переносим в русскую версию
  INSERT INTO "media_locales" ("alt", "_locale", "_parent_id") SELECT "alt", 'ru', "id" FROM "media" WHERE "alt" IS NOT NULL AND "alt" <> '';
  ALTER TABLE "media" DROP COLUMN "alt";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // русский alt возвращается в общий столбец media.alt
  await db.execute(sql`CREATE TEMP TABLE "_media_alt_backup" AS SELECT "_parent_id", "alt" FROM "media_locales" WHERE "_locale" = 'ru';`)
  await db.execute(sql`
   ALTER TABLE "pages_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_version_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_templates" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "page_templates_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "shared_blocks" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "shared_blocks_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v_version_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "events_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_events_v_version_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_review_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "people" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "people_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "clients_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "awards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "awards_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "polls_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "polls_options_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "polls" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "polls_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "poll_votes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vulnerabilities" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vulnerabilities_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vulnerabilities_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vulnerabilities_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "media_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_visible_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "forms_hidden_options" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "not_found_log" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_variables_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_variables_items_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_variables" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "maintenance" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "maintenance_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_review_log" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_version_review_log" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "page_templates" CASCADE;
  DROP TABLE "page_templates_locales" CASCADE;
  DROP TABLE "shared_blocks" CASCADE;
  DROP TABLE "shared_blocks_locales" CASCADE;
  DROP TABLE "publications_review_log" CASCADE;
  DROP TABLE "_publications_v_version_review_log" CASCADE;
  DROP TABLE "projects_review_log" CASCADE;
  DROP TABLE "_projects_v_version_review_log" CASCADE;
  DROP TABLE "events_review_log" CASCADE;
  DROP TABLE "_events_v_version_review_log" CASCADE;
  DROP TABLE "vacancies_review_log" CASCADE;
  DROP TABLE "_vacancies_v_version_review_log" CASCADE;
  DROP TABLE "people" CASCADE;
  DROP TABLE "people_locales" CASCADE;
  DROP TABLE "clients" CASCADE;
  DROP TABLE "clients_locales" CASCADE;
  DROP TABLE "awards" CASCADE;
  DROP TABLE "awards_locales" CASCADE;
  DROP TABLE "polls_options" CASCADE;
  DROP TABLE "polls_options_locales" CASCADE;
  DROP TABLE "polls" CASCADE;
  DROP TABLE "polls_locales" CASCADE;
  DROP TABLE "poll_votes" CASCADE;
  DROP TABLE "vulnerabilities" CASCADE;
  DROP TABLE "vulnerabilities_locales" CASCADE;
  DROP TABLE "_vulnerabilities_v" CASCADE;
  DROP TABLE "_vulnerabilities_v_locales" CASCADE;
  DROP TABLE "media_locales" CASCADE;
  DROP TABLE "forms_visible_options" CASCADE;
  DROP TABLE "forms_hidden_options" CASCADE;
  DROP TABLE "not_found_log" CASCADE;
  DROP TABLE "site_variables_items" CASCADE;
  DROP TABLE "site_variables_items_locales" CASCADE;
  DROP TABLE "site_variables" CASCADE;
  DROP TABLE "maintenance" CASCADE;
  DROP TABLE "maintenance_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_page_templates_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_shared_blocks_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_people_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_clients_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_awards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_polls_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_poll_votes_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_vulnerabilities_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_not_found_log_fk";
  
  ALTER TABLE "forms_visible" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "forms_visible" ALTER COLUMN "type" SET DEFAULT 'input'::text;
  DROP TYPE "public"."enum_forms_visible_type";
  CREATE TYPE "public"."enum_forms_visible_type" AS ENUM('input', 'phone', 'textarea', 'file');
  ALTER TABLE "forms_visible" ALTER COLUMN "type" SET DEFAULT 'input'::"public"."enum_forms_visible_type";
  ALTER TABLE "forms_visible" ALTER COLUMN "type" SET DATA TYPE "public"."enum_forms_visible_type" USING "type"::"public"."enum_forms_visible_type";
  ALTER TABLE "forms_hidden" ALTER COLUMN "type" SET DATA TYPE text;
  ALTER TABLE "forms_hidden" ALTER COLUMN "type" SET DEFAULT 'input'::text;
  DROP TYPE "public"."enum_forms_hidden_type";
  CREATE TYPE "public"."enum_forms_hidden_type" AS ENUM('input', 'phone', 'textarea', 'file');
  ALTER TABLE "forms_hidden" ALTER COLUMN "type" SET DEFAULT 'input'::"public"."enum_forms_hidden_type";
  ALTER TABLE "forms_hidden" ALTER COLUMN "type" SET DATA TYPE "public"."enum_forms_hidden_type" USING "type"::"public"."enum_forms_hidden_type";
  ALTER TABLE "search_index" ALTER COLUMN "type" SET DATA TYPE text;
  DROP TYPE "public"."enum_search_index_type";
  CREATE TYPE "public"."enum_search_index_type" AS ENUM('news', 'article', 'journal', 'service', 'company', 'industry', 'project', 'career', 'other');
  ALTER TABLE "search_index" ALTER COLUMN "type" SET DATA TYPE "public"."enum_search_index_type" USING "type"::"public"."enum_search_index_type";
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'deliver-email', 'deliver-bitrix24', 'deliver-friendwork', 'cleanup-submissions', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'deliver-email', 'deliver-bitrix24', 'deliver-friendwork', 'cleanup-submissions', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX IF EXISTS "pages_translation_status_idx";
  DROP INDEX IF EXISTS "pages_review_status_idx";
  DROP INDEX IF EXISTS "_pages_v_version_version_translation_status_idx";
  DROP INDEX IF EXISTS "_pages_v_version_version_review_status_idx";
  DROP INDEX IF EXISTS "publications_translation_status_idx";
  DROP INDEX IF EXISTS "publications_review_status_idx";
  DROP INDEX IF EXISTS "_publications_v_version_version_translation_status_idx";
  DROP INDEX IF EXISTS "_publications_v_version_version_review_status_idx";
  DROP INDEX IF EXISTS "projects_translation_status_idx";
  DROP INDEX IF EXISTS "projects_review_status_idx";
  DROP INDEX IF EXISTS "_projects_v_version_version_translation_status_idx";
  DROP INDEX IF EXISTS "_projects_v_version_version_review_status_idx";
  DROP INDEX IF EXISTS "events_translation_status_idx";
  DROP INDEX IF EXISTS "events_review_status_idx";
  DROP INDEX IF EXISTS "_events_v_version_version_translation_status_idx";
  DROP INDEX IF EXISTS "_events_v_version_version_review_status_idx";
  DROP INDEX IF EXISTS "vacancies_translation_status_idx";
  DROP INDEX IF EXISTS "vacancies_review_status_idx";
  DROP INDEX IF EXISTS "_vacancies_v_version_version_translation_status_idx";
  DROP INDEX IF EXISTS "_vacancies_v_version_version_review_status_idx";
  DROP INDEX IF EXISTS "media_hash_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_page_templates_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_shared_blocks_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_people_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_clients_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_awards_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_polls_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_poll_votes_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_vulnerabilities_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_not_found_log_id_idx";
  ALTER TABLE "forms_visible" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "forms_hidden" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "media" ADD COLUMN "alt" varchar;
  ALTER TABLE "pages" DROP COLUMN "layout";
  ALTER TABLE "pages" DROP COLUMN "translation_status";
  ALTER TABLE "pages" DROP COLUMN "ru_edited_at";
  ALTER TABLE "pages" DROP COLUMN "en_edited_at";
  ALTER TABLE "pages" DROP COLUMN "review_status";
  ALTER TABLE "_pages_v" DROP COLUMN "version_layout";
  ALTER TABLE "_pages_v" DROP COLUMN "version_translation_status";
  ALTER TABLE "_pages_v" DROP COLUMN "version_ru_edited_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_en_edited_at";
  ALTER TABLE "_pages_v" DROP COLUMN "version_review_status";
  ALTER TABLE "publications" DROP COLUMN "translation_status";
  ALTER TABLE "publications" DROP COLUMN "ru_edited_at";
  ALTER TABLE "publications" DROP COLUMN "en_edited_at";
  ALTER TABLE "publications" DROP COLUMN "review_status";
  ALTER TABLE "_publications_v" DROP COLUMN "version_translation_status";
  ALTER TABLE "_publications_v" DROP COLUMN "version_ru_edited_at";
  ALTER TABLE "_publications_v" DROP COLUMN "version_en_edited_at";
  ALTER TABLE "_publications_v" DROP COLUMN "version_review_status";
  ALTER TABLE "projects" DROP COLUMN "translation_status";
  ALTER TABLE "projects" DROP COLUMN "ru_edited_at";
  ALTER TABLE "projects" DROP COLUMN "en_edited_at";
  ALTER TABLE "projects" DROP COLUMN "review_status";
  ALTER TABLE "_projects_v" DROP COLUMN "version_translation_status";
  ALTER TABLE "_projects_v" DROP COLUMN "version_ru_edited_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_en_edited_at";
  ALTER TABLE "_projects_v" DROP COLUMN "version_review_status";
  ALTER TABLE "events" DROP COLUMN "translation_status";
  ALTER TABLE "events" DROP COLUMN "ru_edited_at";
  ALTER TABLE "events" DROP COLUMN "en_edited_at";
  ALTER TABLE "events" DROP COLUMN "review_status";
  ALTER TABLE "_events_v" DROP COLUMN "version_translation_status";
  ALTER TABLE "_events_v" DROP COLUMN "version_ru_edited_at";
  ALTER TABLE "_events_v" DROP COLUMN "version_en_edited_at";
  ALTER TABLE "_events_v" DROP COLUMN "version_review_status";
  ALTER TABLE "vacancies" DROP COLUMN "translation_status";
  ALTER TABLE "vacancies" DROP COLUMN "ru_edited_at";
  ALTER TABLE "vacancies" DROP COLUMN "en_edited_at";
  ALTER TABLE "vacancies" DROP COLUMN "review_status";
  ALTER TABLE "_vacancies_v" DROP COLUMN "version_translation_status";
  ALTER TABLE "_vacancies_v" DROP COLUMN "version_ru_edited_at";
  ALTER TABLE "_vacancies_v" DROP COLUMN "version_en_edited_at";
  ALTER TABLE "_vacancies_v" DROP COLUMN "version_review_status";
  ALTER TABLE "media" DROP COLUMN "hash";
  ALTER TABLE "forms_visible" DROP COLUMN "show_if_name";
  ALTER TABLE "forms_visible" DROP COLUMN "show_if_value";
  ALTER TABLE "forms_hidden" DROP COLUMN "show_if_name";
  ALTER TABLE "forms_hidden" DROP COLUMN "show_if_value";
  ALTER TABLE "forms_locales" DROP COLUMN "success_title";
  ALTER TABLE "forms_locales" DROP COLUMN "success_text";
  ALTER TABLE "users" DROP COLUMN "totp_enabled";
  ALTER TABLE "users" DROP COLUMN "totp_secret";
  ALTER TABLE "users" DROP COLUMN "totp_pending";
  ALTER TABLE "users" DROP COLUMN "totp_last_step";
  ALTER TABLE "users" DROP COLUMN "totp_recovery";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "page_templates_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "shared_blocks_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "people_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "clients_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "awards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "polls_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "poll_votes_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vulnerabilities_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "not_found_log_id";
  DROP TYPE "public"."enum_pages_layout";
  DROP TYPE "public"."enum_pages_translation_status";
  DROP TYPE "public"."enum_pages_review_status";
  DROP TYPE "public"."enum__pages_v_version_layout";
  DROP TYPE "public"."enum__pages_v_version_translation_status";
  DROP TYPE "public"."enum__pages_v_version_review_status";
  DROP TYPE "public"."enum_publications_translation_status";
  DROP TYPE "public"."enum_publications_review_status";
  DROP TYPE "public"."enum__publications_v_version_translation_status";
  DROP TYPE "public"."enum__publications_v_version_review_status";
  DROP TYPE "public"."enum_projects_translation_status";
  DROP TYPE "public"."enum_projects_review_status";
  DROP TYPE "public"."enum__projects_v_version_translation_status";
  DROP TYPE "public"."enum__projects_v_version_review_status";
  DROP TYPE "public"."enum_events_translation_status";
  DROP TYPE "public"."enum_events_review_status";
  DROP TYPE "public"."enum__events_v_version_translation_status";
  DROP TYPE "public"."enum__events_v_version_review_status";
  DROP TYPE "public"."enum_vacancies_translation_status";
  DROP TYPE "public"."enum_vacancies_review_status";
  DROP TYPE "public"."enum__vacancies_v_version_translation_status";
  DROP TYPE "public"."enum__vacancies_v_version_review_status";
  DROP TYPE "public"."enum_polls_show_results";
  DROP TYPE "public"."enum_vulnerabilities_state";
  DROP TYPE "public"."enum_vulnerabilities_status";
  DROP TYPE "public"."enum__vulnerabilities_v_version_state";
  DROP TYPE "public"."enum__vulnerabilities_v_version_status";
  DROP TYPE "public"."enum__vulnerabilities_v_published_locale";`)
  await db.execute(sql`UPDATE "media" SET "alt" = b."alt" FROM "_media_alt_backup" b WHERE "media"."id" = b."_parent_id"; DROP TABLE "_media_alt_backup";`)
}
