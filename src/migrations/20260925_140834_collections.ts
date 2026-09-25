import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_publications_type" AS ENUM('news', 'article', 'journal');
  CREATE TYPE "public"."enum_publications_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_publications_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__publications_v_version_type" AS ENUM('news', 'article', 'journal');
  CREATE TYPE "public"."enum__publications_v_version_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__publications_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__publications_v_published_locale" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum_projects_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__projects_v_published_locale" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum_vacancies_about_vacancy_items_variant" AS ENUM('default', 'withBg');
  CREATE TYPE "public"."enum_vacancies_be_plus_items_variant" AS ENUM('default', 'withBg');
  CREATE TYPE "public"."enum_vacancies_kind" AS ENUM('vacancy', 'internship');
  CREATE TYPE "public"."enum_vacancies_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_vacancies_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_vacancies_about_vacancy_variant" AS ENUM('default', 'withBg');
  CREATE TYPE "public"."enum_vacancies_be_plus_variant" AS ENUM('default', 'withBg');
  CREATE TYPE "public"."enum_vacancies_reviews_variant" AS ENUM('default', 'reviews_lime');
  CREATE TYPE "public"."enum__vacancies_v_version_about_vacancy_items_variant" AS ENUM('default', 'withBg');
  CREATE TYPE "public"."enum__vacancies_v_version_be_plus_items_variant" AS ENUM('default', 'withBg');
  CREATE TYPE "public"."enum__vacancies_v_version_kind" AS ENUM('vacancy', 'internship');
  CREATE TYPE "public"."enum__vacancies_v_version_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__vacancies_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__vacancies_v_published_locale" AS ENUM('ru', 'en');
  CREATE TYPE "public"."enum__vacancies_v_version_about_vacancy_variant" AS ENUM('default', 'withBg');
  CREATE TYPE "public"."enum__vacancies_v_version_be_plus_variant" AS ENUM('default', 'withBg');
  CREATE TYPE "public"."enum__vacancies_v_version_reviews_variant" AS ENUM('default', 'reviews_lime');
  CREATE TYPE "public"."enum_terms_kind" AS ENUM('universal', 'vacancyTag', 'city', 'experience', 'workFormat', 'eventFormat', 'center', 'partnerType');
  CREATE TYPE "public"."enum_sec_xp_expertise_elector_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_xp_callback_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_xp_journal_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_xp_meta_crumb_variant" AS ENUM('default', 'breadcrumbs_blue');
  CREATE TYPE "public"."enum__sec_xp_v_version_expertise_elector_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_xp_v_version_callback_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_xp_v_version_journal_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_xp_v_version_meta_crumb_variant" AS ENUM('default', 'breadcrumbs_blue');
  CREATE TYPE "public"."enum_sec_cat_catalog_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_cat_callback_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_cat_meta_crumb_variant" AS ENUM('default', 'breadcrumbs_blue');
  CREATE TYPE "public"."enum__sec_cat_v_version_catalog_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_cat_v_version_callback_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_cat_v_version_meta_crumb_variant" AS ENUM('default', 'breadcrumbs_blue');
  CREATE TYPE "public"."enum_sec_car_vacancies_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_car_internships_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_car_callback_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_car_meta_crumb_variant" AS ENUM('default', 'breadcrumbs_blue');
  CREATE TYPE "public"."enum__sec_car_v_version_vacancies_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_car_v_version_internships_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_car_v_version_callback_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_car_v_version_meta_crumb_variant" AS ENUM('default', 'breadcrumbs_blue');
  CREATE TYPE "public"."enum_sec_prt_callback_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum_sec_prt_meta_crumb_variant" AS ENUM('default', 'breadcrumbs_blue');
  CREATE TYPE "public"."enum__sec_prt_v_version_callback_background_type" AS ENUM('mixed', 'image', 'video');
  CREATE TYPE "public"."enum__sec_prt_v_version_meta_crumb_variant" AS ENUM('default', 'breadcrumbs_blue');
  CREATE TABLE "publications" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type" "enum_publications_type" DEFAULT 'news',
  	"date" timestamp(3) with time zone,
  	"cover_src_id" integer,
  	"cover_alt" varchar,
  	"cover_tablet_id" integer,
  	"cover_desktop_id" integer,
  	"background_src_id" integer,
  	"background_alt" varchar,
  	"background_tablet_id" integer,
  	"background_desktop_id" integer,
  	"background_type" "enum_publications_background_type" DEFAULT 'mixed',
  	"slug" varchar,
  	"recommended" boolean,
  	"priority" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_publications_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "publications_locales" (
  	"title" varchar,
  	"description" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_keywords" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "publications_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"directions_id" integer,
  	"industries_id" integer,
  	"terms_id" integer,
  	"services_id" integer,
  	"publications_id" integer
  );
  
  CREATE TABLE "_publications_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_type" "enum__publications_v_version_type" DEFAULT 'news',
  	"version_date" timestamp(3) with time zone,
  	"version_cover_src_id" integer,
  	"version_cover_alt" varchar,
  	"version_cover_tablet_id" integer,
  	"version_cover_desktop_id" integer,
  	"version_background_src_id" integer,
  	"version_background_alt" varchar,
  	"version_background_tablet_id" integer,
  	"version_background_desktop_id" integer,
  	"version_background_type" "enum__publications_v_version_background_type" DEFAULT 'mixed',
  	"version_slug" varchar,
  	"version_recommended" boolean,
  	"version_priority" numeric DEFAULT 0,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__publications_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__publications_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_publications_v_locales" (
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_keywords" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_publications_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"directions_id" integer,
  	"industries_id" integer,
  	"terms_id" integer,
  	"services_id" integer,
  	"publications_id" integer
  );
  
  CREATE TABLE "projects_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "projects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"company_src_id" integer,
  	"company_alt" varchar,
  	"company_tablet_id" integer,
  	"company_desktop_id" integer,
  	"btn_title" varchar DEFAULT 'Подробнее о проекте',
  	"btn_url" varchar,
  	"date" timestamp(3) with time zone,
  	"recommended" boolean,
  	"priority" numeric DEFAULT 0,
  	"hide_in_grid" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_projects_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "projects_locales" (
  	"title" varchar,
  	"sup_tag" varchar,
  	"tag" varchar,
  	"second_title" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "projects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"directions_id" integer,
  	"industries_id" integer
  );
  
  CREATE TABLE "_projects_v_version_stats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_projects_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_company_src_id" integer,
  	"version_company_alt" varchar,
  	"version_company_tablet_id" integer,
  	"version_company_desktop_id" integer,
  	"version_btn_title" varchar DEFAULT 'Подробнее о проекте',
  	"version_btn_url" varchar,
  	"version_date" timestamp(3) with time zone,
  	"version_recommended" boolean,
  	"version_priority" numeric DEFAULT 0,
  	"version_hide_in_grid" boolean,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__projects_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__projects_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_projects_v_locales" (
  	"version_title" varchar,
  	"version_sup_tag" varchar,
  	"version_tag" varchar,
  	"version_second_title" varchar,
  	"version_description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_projects_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"directions_id" integer,
  	"industries_id" integer
  );
  
  CREATE TABLE "services" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"direction_id" integer NOT NULL,
  	"subdirection_id" integer,
  	"slug" varchar,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "services_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "services_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"industries_id" integer
  );
  
  CREATE TABLE "directions_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"src_id" integer NOT NULL,
  	"alt" varchar,
  	"tablet_id" integer,
  	"desktop_id" integer
  );
  
  CREATE TABLE "directions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"center_id" integer,
  	"image_src_id" integer,
  	"image_alt" varchar,
  	"image_tablet_id" integer,
  	"image_desktop_id" integer,
  	"code" varchar NOT NULL,
  	"order" numeric DEFAULT 100,
  	"page_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "directions_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "subdirections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"direction_id" integer NOT NULL,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subdirections_locales" (
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "industries_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "industries_logos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"src_id" integer NOT NULL,
  	"alt" varchar,
  	"tablet_id" integer,
  	"desktop_id" integer
  );
  
  CREATE TABLE "industries" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"code" varchar NOT NULL,
  	"order" numeric DEFAULT 100,
  	"page_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "industries_locales" (
  	"title" varchar NOT NULL,
  	"short" varchar,
  	"description" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "vacancies_about_direction_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"is_active" boolean
  );
  
  CREATE TABLE "vacancies_about_vacancy_items_subitems" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "vacancies_about_vacancy_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"img_src_id" integer,
  	"img_alt" varchar,
  	"img_tablet_id" integer,
  	"img_desktop_id" integer,
  	"variant" "enum_vacancies_about_vacancy_items_variant" DEFAULT 'default'
  );
  
  CREATE TABLE "vacancies_be_plus_items_subitems" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "vacancies_be_plus_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"img_src_id" integer,
  	"img_alt" varchar,
  	"img_tablet_id" integer,
  	"img_desktop_id" integer,
  	"variant" "enum_vacancies_be_plus_items_variant" DEFAULT 'default'
  );
  
  CREATE TABLE "vacancies_advantages_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "vacancies_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"is_open" boolean
  );
  
  CREATE TABLE "vacancies_reviews_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"description" varchar,
  	"person_name" varchar,
  	"person_position" varchar,
  	"person_img_src_id" integer,
  	"person_img_alt" varchar,
  	"person_img_tablet_id" integer,
  	"person_img_desktop_id" integer
  );
  
  CREATE TABLE "vacancies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_vacancies_kind" DEFAULT 'vacancy',
  	"tag_id" integer,
  	"city_id" integer,
  	"experience_id" integer,
  	"work_format_id" integer,
  	"background_src_id" integer,
  	"background_alt" varchar,
  	"background_tablet_id" integer,
  	"background_desktop_id" integer,
  	"background_type" "enum_vacancies_background_type" DEFAULT 'mixed',
  	"close_at" timestamp(3) with time zone,
  	"slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_vacancies_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "vacancies_locales" (
  	"title" varchar,
  	"about_direction_tag" varchar,
  	"about_direction_title" varchar,
  	"about_direction_subtitle" varchar,
  	"about_direction_hash" varchar,
  	"about_direction_nav_title" varchar,
  	"about_vacancy_tag" varchar,
  	"about_vacancy_title" varchar,
  	"about_vacancy_description" varchar,
  	"about_vacancy_variant" "enum_vacancies_about_vacancy_variant" DEFAULT 'default',
  	"about_vacancy_hash" varchar,
  	"about_vacancy_nav_title" varchar,
  	"be_plus_tag" varchar,
  	"be_plus_title" varchar,
  	"be_plus_description" varchar,
  	"be_plus_variant" "enum_vacancies_be_plus_variant" DEFAULT 'default',
  	"be_plus_hash" varchar,
  	"be_plus_nav_title" varchar,
  	"advantages_tag" varchar,
  	"advantages_title" varchar,
  	"advantages_hash" varchar,
  	"advantages_nav_title" varchar,
  	"faq_tag" varchar,
  	"faq_title" varchar,
  	"faq_hash" varchar,
  	"faq_nav_title" varchar,
  	"reviews_tag" varchar,
  	"reviews_title" varchar,
  	"reviews_variant" "enum_vacancies_reviews_variant" DEFAULT 'default',
  	"reviews_hash" varchar,
  	"reviews_nav_title" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_keywords" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "vacancies_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vacancies_id" integer
  );
  
  CREATE TABLE "_vacancies_v_version_about_direction_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"is_active" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vacancies_v_version_about_vacancy_items_subitems" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vacancies_v_version_about_vacancy_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"img_src_id" integer,
  	"img_alt" varchar,
  	"img_tablet_id" integer,
  	"img_desktop_id" integer,
  	"variant" "enum__vacancies_v_version_about_vacancy_items_variant" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vacancies_v_version_be_plus_items_subitems" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vacancies_v_version_be_plus_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"img_src_id" integer,
  	"img_alt" varchar,
  	"img_tablet_id" integer,
  	"img_desktop_id" integer,
  	"variant" "enum__vacancies_v_version_be_plus_items_variant" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vacancies_v_version_advantages_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vacancies_v_version_faq_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"description" varchar,
  	"is_open" boolean,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vacancies_v_version_reviews_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"description" varchar,
  	"person_name" varchar,
  	"person_position" varchar,
  	"person_img_src_id" integer,
  	"person_img_alt" varchar,
  	"person_img_tablet_id" integer,
  	"person_img_desktop_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_vacancies_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_kind" "enum__vacancies_v_version_kind" DEFAULT 'vacancy',
  	"version_tag_id" integer,
  	"version_city_id" integer,
  	"version_experience_id" integer,
  	"version_work_format_id" integer,
  	"version_background_src_id" integer,
  	"version_background_alt" varchar,
  	"version_background_tablet_id" integer,
  	"version_background_desktop_id" integer,
  	"version_background_type" "enum__vacancies_v_version_background_type" DEFAULT 'mixed',
  	"version_close_at" timestamp(3) with time zone,
  	"version_slug" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__vacancies_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__vacancies_v_published_locale",
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_vacancies_v_locales" (
  	"version_title" varchar,
  	"version_about_direction_tag" varchar,
  	"version_about_direction_title" varchar,
  	"version_about_direction_subtitle" varchar,
  	"version_about_direction_hash" varchar,
  	"version_about_direction_nav_title" varchar,
  	"version_about_vacancy_tag" varchar,
  	"version_about_vacancy_title" varchar,
  	"version_about_vacancy_description" varchar,
  	"version_about_vacancy_variant" "enum__vacancies_v_version_about_vacancy_variant" DEFAULT 'default',
  	"version_about_vacancy_hash" varchar,
  	"version_about_vacancy_nav_title" varchar,
  	"version_be_plus_tag" varchar,
  	"version_be_plus_title" varchar,
  	"version_be_plus_description" varchar,
  	"version_be_plus_variant" "enum__vacancies_v_version_be_plus_variant" DEFAULT 'default',
  	"version_be_plus_hash" varchar,
  	"version_be_plus_nav_title" varchar,
  	"version_advantages_tag" varchar,
  	"version_advantages_title" varchar,
  	"version_advantages_hash" varchar,
  	"version_advantages_nav_title" varchar,
  	"version_faq_tag" varchar,
  	"version_faq_title" varchar,
  	"version_faq_hash" varchar,
  	"version_faq_nav_title" varchar,
  	"version_reviews_tag" varchar,
  	"version_reviews_title" varchar,
  	"version_reviews_variant" "enum__vacancies_v_version_reviews_variant" DEFAULT 'default',
  	"version_reviews_hash" varchar,
  	"version_reviews_nav_title" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_keywords" varchar,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_vacancies_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"vacancies_id" integer
  );
  
  CREATE TABLE "partners_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "partners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"logo_src_id" integer,
  	"logo_alt" varchar,
  	"logo_tablet_id" integer,
  	"logo_desktop_id" integer,
  	"type_id" integer,
  	"url" varchar,
  	"order" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "partners_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "partners_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"directions_id" integer
  );
  
  CREATE TABLE "terms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum_terms_kind" NOT NULL,
  	"code" varchar NOT NULL,
  	"order" numeric DEFAULT 100,
  	"email" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "terms_locales" (
  	"title" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sec_xp" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "sec_xp_locales" (
  	"expertise_elector_tag" varchar,
  	"expertise_elector_title" varchar,
  	"expertise_elector_background_src_id" integer,
  	"expertise_elector_background_alt" varchar,
  	"expertise_elector_background_tablet_id" integer,
  	"expertise_elector_background_desktop_id" integer,
  	"expertise_elector_background_type" "enum_sec_xp_expertise_elector_background_type" DEFAULT 'mixed',
  	"callback_tag" varchar,
  	"callback_title" varchar,
  	"callback_background_src_id" integer,
  	"callback_background_alt" varchar,
  	"callback_background_tablet_id" integer,
  	"callback_background_desktop_id" integer,
  	"callback_background_type" "enum_sec_xp_callback_background_type" DEFAULT 'mixed',
  	"callback_form_id" integer,
  	"callback_hash" varchar,
  	"callback_nav_title" varchar,
  	"journal_tag" varchar,
  	"journal_title" varchar,
  	"journal_description" varchar,
  	"journal_btn_title" varchar,
  	"journal_btn_url" varchar,
  	"journal_img_src_id" integer,
  	"journal_img_alt" varchar,
  	"journal_img_tablet_id" integer,
  	"journal_img_desktop_id" integer,
  	"journal_background_src_id" integer,
  	"journal_background_alt" varchar,
  	"journal_background_tablet_id" integer,
  	"journal_background_desktop_id" integer,
  	"journal_background_type" "enum_sec_xp_journal_background_type" DEFAULT 'mixed',
  	"journal_hash" varchar,
  	"journal_nav_title" varchar,
  	"meta_seo_title" varchar,
  	"meta_seo_description" varchar,
  	"meta_crumb" varchar,
  	"meta_crumb_parent_title" varchar,
  	"meta_crumb_parent_url" varchar,
  	"meta_crumb_variant" "enum_sec_xp_meta_crumb_variant" DEFAULT 'default',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sec_xp_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_sec_xp_v_locales" (
  	"version_expertise_elector_tag" varchar,
  	"version_expertise_elector_title" varchar,
  	"version_expertise_elector_background_src_id" integer,
  	"version_expertise_elector_background_alt" varchar,
  	"version_expertise_elector_background_tablet_id" integer,
  	"version_expertise_elector_background_desktop_id" integer,
  	"version_expertise_elector_background_type" "enum__sec_xp_v_version_expertise_elector_background_type" DEFAULT 'mixed',
  	"version_callback_tag" varchar,
  	"version_callback_title" varchar,
  	"version_callback_background_src_id" integer,
  	"version_callback_background_alt" varchar,
  	"version_callback_background_tablet_id" integer,
  	"version_callback_background_desktop_id" integer,
  	"version_callback_background_type" "enum__sec_xp_v_version_callback_background_type" DEFAULT 'mixed',
  	"version_callback_form_id" integer,
  	"version_callback_hash" varchar,
  	"version_callback_nav_title" varchar,
  	"version_journal_tag" varchar,
  	"version_journal_title" varchar,
  	"version_journal_description" varchar,
  	"version_journal_btn_title" varchar,
  	"version_journal_btn_url" varchar,
  	"version_journal_img_src_id" integer,
  	"version_journal_img_alt" varchar,
  	"version_journal_img_tablet_id" integer,
  	"version_journal_img_desktop_id" integer,
  	"version_journal_background_src_id" integer,
  	"version_journal_background_alt" varchar,
  	"version_journal_background_tablet_id" integer,
  	"version_journal_background_desktop_id" integer,
  	"version_journal_background_type" "enum__sec_xp_v_version_journal_background_type" DEFAULT 'mixed',
  	"version_journal_hash" varchar,
  	"version_journal_nav_title" varchar,
  	"version_meta_seo_title" varchar,
  	"version_meta_seo_description" varchar,
  	"version_meta_crumb" varchar,
  	"version_meta_crumb_parent_title" varchar,
  	"version_meta_crumb_parent_url" varchar,
  	"version_meta_crumb_variant" "enum__sec_xp_v_version_meta_crumb_variant" DEFAULT 'default',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sec_cat" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "sec_cat_locales" (
  	"catalog_title" varchar,
  	"catalog_description" varchar,
  	"catalog_url" varchar,
  	"catalog_background_src_id" integer,
  	"catalog_background_alt" varchar,
  	"catalog_background_tablet_id" integer,
  	"catalog_background_desktop_id" integer,
  	"catalog_background_type" "enum_sec_cat_catalog_background_type" DEFAULT 'mixed',
  	"callback_tag" varchar,
  	"callback_title" varchar,
  	"callback_background_src_id" integer,
  	"callback_background_alt" varchar,
  	"callback_background_tablet_id" integer,
  	"callback_background_desktop_id" integer,
  	"callback_background_type" "enum_sec_cat_callback_background_type" DEFAULT 'mixed',
  	"callback_form_id" integer,
  	"callback_hash" varchar,
  	"callback_nav_title" varchar,
  	"meta_seo_title" varchar,
  	"meta_seo_description" varchar,
  	"meta_crumb" varchar,
  	"meta_crumb_parent_title" varchar,
  	"meta_crumb_parent_url" varchar,
  	"meta_crumb_variant" "enum_sec_cat_meta_crumb_variant" DEFAULT 'default',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sec_cat_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_sec_cat_v_locales" (
  	"version_catalog_title" varchar,
  	"version_catalog_description" varchar,
  	"version_catalog_url" varchar,
  	"version_catalog_background_src_id" integer,
  	"version_catalog_background_alt" varchar,
  	"version_catalog_background_tablet_id" integer,
  	"version_catalog_background_desktop_id" integer,
  	"version_catalog_background_type" "enum__sec_cat_v_version_catalog_background_type" DEFAULT 'mixed',
  	"version_callback_tag" varchar,
  	"version_callback_title" varchar,
  	"version_callback_background_src_id" integer,
  	"version_callback_background_alt" varchar,
  	"version_callback_background_tablet_id" integer,
  	"version_callback_background_desktop_id" integer,
  	"version_callback_background_type" "enum__sec_cat_v_version_callback_background_type" DEFAULT 'mixed',
  	"version_callback_form_id" integer,
  	"version_callback_hash" varchar,
  	"version_callback_nav_title" varchar,
  	"version_meta_seo_title" varchar,
  	"version_meta_seo_description" varchar,
  	"version_meta_crumb" varchar,
  	"version_meta_crumb_parent_title" varchar,
  	"version_meta_crumb_parent_url" varchar,
  	"version_meta_crumb_variant" "enum__sec_cat_v_version_meta_crumb_variant" DEFAULT 'default',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sec_car" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "sec_car_locales" (
  	"vacancies_background_src_id" integer,
  	"vacancies_background_alt" varchar,
  	"vacancies_background_tablet_id" integer,
  	"vacancies_background_desktop_id" integer,
  	"vacancies_background_type" "enum_sec_car_vacancies_background_type" DEFAULT 'mixed',
  	"vacancies_hash_to_scroll" varchar,
  	"internships_background_src_id" integer,
  	"internships_background_alt" varchar,
  	"internships_background_tablet_id" integer,
  	"internships_background_desktop_id" integer,
  	"internships_background_type" "enum_sec_car_internships_background_type" DEFAULT 'mixed',
  	"internships_hash_to_scroll" varchar,
  	"callback_tag" varchar,
  	"callback_title" varchar,
  	"callback_background_src_id" integer,
  	"callback_background_alt" varchar,
  	"callback_background_tablet_id" integer,
  	"callback_background_desktop_id" integer,
  	"callback_background_type" "enum_sec_car_callback_background_type" DEFAULT 'mixed',
  	"callback_form_id" integer,
  	"callback_hash" varchar,
  	"callback_nav_title" varchar,
  	"meta_seo_title" varchar,
  	"meta_seo_description" varchar,
  	"meta_crumb" varchar,
  	"meta_crumb_parent_title" varchar,
  	"meta_crumb_parent_url" varchar,
  	"meta_crumb_variant" "enum_sec_car_meta_crumb_variant" DEFAULT 'default',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sec_car_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_sec_car_v_locales" (
  	"version_vacancies_background_src_id" integer,
  	"version_vacancies_background_alt" varchar,
  	"version_vacancies_background_tablet_id" integer,
  	"version_vacancies_background_desktop_id" integer,
  	"version_vacancies_background_type" "enum__sec_car_v_version_vacancies_background_type" DEFAULT 'mixed',
  	"version_vacancies_hash_to_scroll" varchar,
  	"version_internships_background_src_id" integer,
  	"version_internships_background_alt" varchar,
  	"version_internships_background_tablet_id" integer,
  	"version_internships_background_desktop_id" integer,
  	"version_internships_background_type" "enum__sec_car_v_version_internships_background_type" DEFAULT 'mixed',
  	"version_internships_hash_to_scroll" varchar,
  	"version_callback_tag" varchar,
  	"version_callback_title" varchar,
  	"version_callback_background_src_id" integer,
  	"version_callback_background_alt" varchar,
  	"version_callback_background_tablet_id" integer,
  	"version_callback_background_desktop_id" integer,
  	"version_callback_background_type" "enum__sec_car_v_version_callback_background_type" DEFAULT 'mixed',
  	"version_callback_form_id" integer,
  	"version_callback_hash" varchar,
  	"version_callback_nav_title" varchar,
  	"version_meta_seo_title" varchar,
  	"version_meta_seo_description" varchar,
  	"version_meta_crumb" varchar,
  	"version_meta_crumb_parent_title" varchar,
  	"version_meta_crumb_parent_url" varchar,
  	"version_meta_crumb_variant" "enum__sec_car_v_version_meta_crumb_variant" DEFAULT 'default',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "sec_prt" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "sec_prt_locales" (
  	"companions_title" varchar,
  	"callback_tag" varchar,
  	"callback_title" varchar,
  	"callback_background_src_id" integer,
  	"callback_background_alt" varchar,
  	"callback_background_tablet_id" integer,
  	"callback_background_desktop_id" integer,
  	"callback_background_type" "enum_sec_prt_callback_background_type" DEFAULT 'mixed',
  	"callback_form_id" integer,
  	"callback_hash" varchar,
  	"callback_nav_title" varchar,
  	"meta_seo_title" varchar,
  	"meta_seo_description" varchar,
  	"meta_crumb" varchar,
  	"meta_crumb_parent_title" varchar,
  	"meta_crumb_parent_url" varchar,
  	"meta_crumb_variant" "enum_sec_prt_meta_crumb_variant" DEFAULT 'default',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_sec_prt_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "_sec_prt_v_locales" (
  	"version_companions_title" varchar,
  	"version_callback_tag" varchar,
  	"version_callback_title" varchar,
  	"version_callback_background_src_id" integer,
  	"version_callback_background_alt" varchar,
  	"version_callback_background_tablet_id" integer,
  	"version_callback_background_desktop_id" integer,
  	"version_callback_background_type" "enum__sec_prt_v_version_callback_background_type" DEFAULT 'mixed',
  	"version_callback_form_id" integer,
  	"version_callback_hash" varchar,
  	"version_callback_nav_title" varchar,
  	"version_meta_seo_title" varchar,
  	"version_meta_seo_description" varchar,
  	"version_meta_crumb" varchar,
  	"version_meta_crumb_parent_title" varchar,
  	"version_meta_crumb_parent_url" varchar,
  	"version_meta_crumb_variant" "enum__sec_prt_v_version_meta_crumb_variant" DEFAULT 'default',
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "publications_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "projects_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "services_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "directions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "subdirections_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "industries_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "vacancies_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "partners_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "terms_id" integer;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_cover_src_id_media_id_fk" FOREIGN KEY ("cover_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_cover_tablet_id_media_id_fk" FOREIGN KEY ("cover_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_cover_desktop_id_media_id_fk" FOREIGN KEY ("cover_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_background_src_id_media_id_fk" FOREIGN KEY ("background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_background_tablet_id_media_id_fk" FOREIGN KEY ("background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications" ADD CONSTRAINT "publications_background_desktop_id_media_id_fk" FOREIGN KEY ("background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "publications_locales" ADD CONSTRAINT "publications_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_directions_fk" FOREIGN KEY ("directions_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_terms_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "publications_rels" ADD CONSTRAINT "publications_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_parent_id_publications_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."publications"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_cover_src_id_media_id_fk" FOREIGN KEY ("version_cover_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_cover_tablet_id_media_id_fk" FOREIGN KEY ("version_cover_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_cover_desktop_id_media_id_fk" FOREIGN KEY ("version_cover_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_background_src_id_media_id_fk" FOREIGN KEY ("version_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_background_tablet_id_media_id_fk" FOREIGN KEY ("version_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v" ADD CONSTRAINT "_publications_v_version_background_desktop_id_media_id_fk" FOREIGN KEY ("version_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_publications_v_locales" ADD CONSTRAINT "_publications_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_publications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_publications_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_directions_fk" FOREIGN KEY ("directions_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_terms_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_publications_v_rels" ADD CONSTRAINT "_publications_v_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_stats" ADD CONSTRAINT "projects_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_company_src_id_media_id_fk" FOREIGN KEY ("company_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_company_tablet_id_media_id_fk" FOREIGN KEY ("company_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects" ADD CONSTRAINT "projects_company_desktop_id_media_id_fk" FOREIGN KEY ("company_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "projects_locales" ADD CONSTRAINT "projects_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_directions_fk" FOREIGN KEY ("directions_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "projects_rels" ADD CONSTRAINT "projects_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_version_stats" ADD CONSTRAINT "_projects_v_version_stats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_parent_id_projects_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_company_src_id_media_id_fk" FOREIGN KEY ("version_company_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_company_tablet_id_media_id_fk" FOREIGN KEY ("version_company_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v" ADD CONSTRAINT "_projects_v_version_company_desktop_id_media_id_fk" FOREIGN KEY ("version_company_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_projects_v_locales" ADD CONSTRAINT "_projects_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_projects_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_directions_fk" FOREIGN KEY ("directions_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_projects_v_rels" ADD CONSTRAINT "_projects_v_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_direction_id_directions_id_fk" FOREIGN KEY ("direction_id") REFERENCES "public"."directions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services" ADD CONSTRAINT "services_subdirection_id_subdirections_id_fk" FOREIGN KEY ("subdirection_id") REFERENCES "public"."subdirections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "services_locales" ADD CONSTRAINT "services_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "services_rels" ADD CONSTRAINT "services_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "directions_logos" ADD CONSTRAINT "directions_logos_src_id_media_id_fk" FOREIGN KEY ("src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "directions_logos" ADD CONSTRAINT "directions_logos_tablet_id_media_id_fk" FOREIGN KEY ("tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "directions_logos" ADD CONSTRAINT "directions_logos_desktop_id_media_id_fk" FOREIGN KEY ("desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "directions_logos" ADD CONSTRAINT "directions_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "directions" ADD CONSTRAINT "directions_center_id_terms_id_fk" FOREIGN KEY ("center_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "directions" ADD CONSTRAINT "directions_image_src_id_media_id_fk" FOREIGN KEY ("image_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "directions" ADD CONSTRAINT "directions_image_tablet_id_media_id_fk" FOREIGN KEY ("image_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "directions" ADD CONSTRAINT "directions_image_desktop_id_media_id_fk" FOREIGN KEY ("image_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "directions" ADD CONSTRAINT "directions_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "directions_locales" ADD CONSTRAINT "directions_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "subdirections" ADD CONSTRAINT "subdirections_direction_id_directions_id_fk" FOREIGN KEY ("direction_id") REFERENCES "public"."directions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "subdirections_locales" ADD CONSTRAINT "subdirections_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."subdirections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_metrics" ADD CONSTRAINT "industries_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries_logos" ADD CONSTRAINT "industries_logos_src_id_media_id_fk" FOREIGN KEY ("src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_logos" ADD CONSTRAINT "industries_logos_tablet_id_media_id_fk" FOREIGN KEY ("tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_logos" ADD CONSTRAINT "industries_logos_desktop_id_media_id_fk" FOREIGN KEY ("desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_logos" ADD CONSTRAINT "industries_logos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "industries" ADD CONSTRAINT "industries_page_id_pages_id_fk" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "industries_locales" ADD CONSTRAINT "industries_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_about_direction_items" ADD CONSTRAINT "vacancies_about_direction_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_about_vacancy_items_subitems" ADD CONSTRAINT "vacancies_about_vacancy_items_subitems_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies_about_vacancy_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_about_vacancy_items" ADD CONSTRAINT "vacancies_about_vacancy_items_img_src_id_media_id_fk" FOREIGN KEY ("img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_about_vacancy_items" ADD CONSTRAINT "vacancies_about_vacancy_items_img_tablet_id_media_id_fk" FOREIGN KEY ("img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_about_vacancy_items" ADD CONSTRAINT "vacancies_about_vacancy_items_img_desktop_id_media_id_fk" FOREIGN KEY ("img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_about_vacancy_items" ADD CONSTRAINT "vacancies_about_vacancy_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_be_plus_items_subitems" ADD CONSTRAINT "vacancies_be_plus_items_subitems_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies_be_plus_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_be_plus_items" ADD CONSTRAINT "vacancies_be_plus_items_img_src_id_media_id_fk" FOREIGN KEY ("img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_be_plus_items" ADD CONSTRAINT "vacancies_be_plus_items_img_tablet_id_media_id_fk" FOREIGN KEY ("img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_be_plus_items" ADD CONSTRAINT "vacancies_be_plus_items_img_desktop_id_media_id_fk" FOREIGN KEY ("img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_be_plus_items" ADD CONSTRAINT "vacancies_be_plus_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_advantages_items" ADD CONSTRAINT "vacancies_advantages_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_faq_items" ADD CONSTRAINT "vacancies_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_reviews_items" ADD CONSTRAINT "vacancies_reviews_items_person_img_src_id_media_id_fk" FOREIGN KEY ("person_img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_reviews_items" ADD CONSTRAINT "vacancies_reviews_items_person_img_tablet_id_media_id_fk" FOREIGN KEY ("person_img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_reviews_items" ADD CONSTRAINT "vacancies_reviews_items_person_img_desktop_id_media_id_fk" FOREIGN KEY ("person_img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_reviews_items" ADD CONSTRAINT "vacancies_reviews_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_tag_id_terms_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_city_id_terms_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_experience_id_terms_id_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_work_format_id_terms_id_fk" FOREIGN KEY ("work_format_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_background_src_id_media_id_fk" FOREIGN KEY ("background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_background_tablet_id_media_id_fk" FOREIGN KEY ("background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_background_desktop_id_media_id_fk" FOREIGN KEY ("background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "vacancies_locales" ADD CONSTRAINT "vacancies_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_rels" ADD CONSTRAINT "vacancies_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "vacancies_rels" ADD CONSTRAINT "vacancies_rels_vacancies_fk" FOREIGN KEY ("vacancies_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_about_direction_items" ADD CONSTRAINT "_vacancies_v_version_about_direction_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_about_vacancy_items_subitems" ADD CONSTRAINT "_vacancies_v_version_about_vacancy_items_subitems_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v_version_about_vacancy_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_about_vacancy_items" ADD CONSTRAINT "_vacancies_v_version_about_vacancy_items_img_src_id_media_id_fk" FOREIGN KEY ("img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_about_vacancy_items" ADD CONSTRAINT "_vacancies_v_version_about_vacancy_items_img_tablet_id_media_id_fk" FOREIGN KEY ("img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_about_vacancy_items" ADD CONSTRAINT "_vacancies_v_version_about_vacancy_items_img_desktop_id_media_id_fk" FOREIGN KEY ("img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_about_vacancy_items" ADD CONSTRAINT "_vacancies_v_version_about_vacancy_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_be_plus_items_subitems" ADD CONSTRAINT "_vacancies_v_version_be_plus_items_subitems_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v_version_be_plus_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_be_plus_items" ADD CONSTRAINT "_vacancies_v_version_be_plus_items_img_src_id_media_id_fk" FOREIGN KEY ("img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_be_plus_items" ADD CONSTRAINT "_vacancies_v_version_be_plus_items_img_tablet_id_media_id_fk" FOREIGN KEY ("img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_be_plus_items" ADD CONSTRAINT "_vacancies_v_version_be_plus_items_img_desktop_id_media_id_fk" FOREIGN KEY ("img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_be_plus_items" ADD CONSTRAINT "_vacancies_v_version_be_plus_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_advantages_items" ADD CONSTRAINT "_vacancies_v_version_advantages_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_faq_items" ADD CONSTRAINT "_vacancies_v_version_faq_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_reviews_items" ADD CONSTRAINT "_vacancies_v_version_reviews_items_person_img_src_id_media_id_fk" FOREIGN KEY ("person_img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_reviews_items" ADD CONSTRAINT "_vacancies_v_version_reviews_items_person_img_tablet_id_media_id_fk" FOREIGN KEY ("person_img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_reviews_items" ADD CONSTRAINT "_vacancies_v_version_reviews_items_person_img_desktop_id_media_id_fk" FOREIGN KEY ("person_img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_version_reviews_items" ADD CONSTRAINT "_vacancies_v_version_reviews_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v" ADD CONSTRAINT "_vacancies_v_parent_id_vacancies_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."vacancies"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v" ADD CONSTRAINT "_vacancies_v_version_tag_id_terms_id_fk" FOREIGN KEY ("version_tag_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v" ADD CONSTRAINT "_vacancies_v_version_city_id_terms_id_fk" FOREIGN KEY ("version_city_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v" ADD CONSTRAINT "_vacancies_v_version_experience_id_terms_id_fk" FOREIGN KEY ("version_experience_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v" ADD CONSTRAINT "_vacancies_v_version_work_format_id_terms_id_fk" FOREIGN KEY ("version_work_format_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v" ADD CONSTRAINT "_vacancies_v_version_background_src_id_media_id_fk" FOREIGN KEY ("version_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v" ADD CONSTRAINT "_vacancies_v_version_background_tablet_id_media_id_fk" FOREIGN KEY ("version_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v" ADD CONSTRAINT "_vacancies_v_version_background_desktop_id_media_id_fk" FOREIGN KEY ("version_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_vacancies_v_locales" ADD CONSTRAINT "_vacancies_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_rels" ADD CONSTRAINT "_vacancies_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_vacancies_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_vacancies_v_rels" ADD CONSTRAINT "_vacancies_v_rels_vacancies_fk" FOREIGN KEY ("vacancies_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_items" ADD CONSTRAINT "partners_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_src_id_media_id_fk" FOREIGN KEY ("logo_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_tablet_id_media_id_fk" FOREIGN KEY ("logo_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_logo_desktop_id_media_id_fk" FOREIGN KEY ("logo_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners" ADD CONSTRAINT "partners_type_id_terms_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."terms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "partners_locales" ADD CONSTRAINT "partners_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "partners_rels" ADD CONSTRAINT "partners_rels_directions_fk" FOREIGN KEY ("directions_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "terms_locales" ADD CONSTRAINT "terms_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_expertise_elector_background_src_id_media_id_fk" FOREIGN KEY ("expertise_elector_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_expertise_elector_background_tablet_id_media_id_fk" FOREIGN KEY ("expertise_elector_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_expertise_elector_background_desktop_id_media_id_fk" FOREIGN KEY ("expertise_elector_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_callback_background_src_id_media_id_fk" FOREIGN KEY ("callback_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_callback_background_tablet_id_media_id_fk" FOREIGN KEY ("callback_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_callback_background_desktop_id_media_id_fk" FOREIGN KEY ("callback_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_callback_form_id_forms_id_fk" FOREIGN KEY ("callback_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_journal_img_src_id_media_id_fk" FOREIGN KEY ("journal_img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_journal_img_tablet_id_media_id_fk" FOREIGN KEY ("journal_img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_journal_img_desktop_id_media_id_fk" FOREIGN KEY ("journal_img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_journal_background_src_id_media_id_fk" FOREIGN KEY ("journal_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_journal_background_tablet_id_media_id_fk" FOREIGN KEY ("journal_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_journal_background_desktop_id_media_id_fk" FOREIGN KEY ("journal_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_xp_locales" ADD CONSTRAINT "sec_xp_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sec_xp"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_expertise_elector_background_src_id_media_id_fk" FOREIGN KEY ("version_expertise_elector_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_expertise_elector_background_tablet_id_media_id_fk" FOREIGN KEY ("version_expertise_elector_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_expertise_elector_background_desktop_id_media_id_fk" FOREIGN KEY ("version_expertise_elector_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_callback_background_src_id_media_id_fk" FOREIGN KEY ("version_callback_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_callback_background_tablet_id_media_id_fk" FOREIGN KEY ("version_callback_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_callback_background_desktop_id_media_id_fk" FOREIGN KEY ("version_callback_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_callback_form_id_forms_id_fk" FOREIGN KEY ("version_callback_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_journal_img_src_id_media_id_fk" FOREIGN KEY ("version_journal_img_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_journal_img_tablet_id_media_id_fk" FOREIGN KEY ("version_journal_img_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_journal_img_desktop_id_media_id_fk" FOREIGN KEY ("version_journal_img_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_journal_background_src_id_media_id_fk" FOREIGN KEY ("version_journal_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_journal_background_tablet_id_media_id_fk" FOREIGN KEY ("version_journal_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_version_journal_background_desktop_id_media_id_fk" FOREIGN KEY ("version_journal_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_xp_v_locales" ADD CONSTRAINT "_sec_xp_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sec_xp_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sec_cat_locales" ADD CONSTRAINT "sec_cat_locales_catalog_background_src_id_media_id_fk" FOREIGN KEY ("catalog_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_cat_locales" ADD CONSTRAINT "sec_cat_locales_catalog_background_tablet_id_media_id_fk" FOREIGN KEY ("catalog_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_cat_locales" ADD CONSTRAINT "sec_cat_locales_catalog_background_desktop_id_media_id_fk" FOREIGN KEY ("catalog_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_cat_locales" ADD CONSTRAINT "sec_cat_locales_callback_background_src_id_media_id_fk" FOREIGN KEY ("callback_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_cat_locales" ADD CONSTRAINT "sec_cat_locales_callback_background_tablet_id_media_id_fk" FOREIGN KEY ("callback_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_cat_locales" ADD CONSTRAINT "sec_cat_locales_callback_background_desktop_id_media_id_fk" FOREIGN KEY ("callback_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_cat_locales" ADD CONSTRAINT "sec_cat_locales_callback_form_id_forms_id_fk" FOREIGN KEY ("callback_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_cat_locales" ADD CONSTRAINT "sec_cat_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sec_cat"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sec_cat_v_locales" ADD CONSTRAINT "_sec_cat_v_locales_version_catalog_background_src_id_media_id_fk" FOREIGN KEY ("version_catalog_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_cat_v_locales" ADD CONSTRAINT "_sec_cat_v_locales_version_catalog_background_tablet_id_media_id_fk" FOREIGN KEY ("version_catalog_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_cat_v_locales" ADD CONSTRAINT "_sec_cat_v_locales_version_catalog_background_desktop_id_media_id_fk" FOREIGN KEY ("version_catalog_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_cat_v_locales" ADD CONSTRAINT "_sec_cat_v_locales_version_callback_background_src_id_media_id_fk" FOREIGN KEY ("version_callback_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_cat_v_locales" ADD CONSTRAINT "_sec_cat_v_locales_version_callback_background_tablet_id_media_id_fk" FOREIGN KEY ("version_callback_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_cat_v_locales" ADD CONSTRAINT "_sec_cat_v_locales_version_callback_background_desktop_id_media_id_fk" FOREIGN KEY ("version_callback_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_cat_v_locales" ADD CONSTRAINT "_sec_cat_v_locales_version_callback_form_id_forms_id_fk" FOREIGN KEY ("version_callback_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_cat_v_locales" ADD CONSTRAINT "_sec_cat_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sec_cat_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_vacancies_background_src_id_media_id_fk" FOREIGN KEY ("vacancies_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_vacancies_background_tablet_id_media_id_fk" FOREIGN KEY ("vacancies_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_vacancies_background_desktop_id_media_id_fk" FOREIGN KEY ("vacancies_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_internships_background_src_id_media_id_fk" FOREIGN KEY ("internships_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_internships_background_tablet_id_media_id_fk" FOREIGN KEY ("internships_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_internships_background_desktop_id_media_id_fk" FOREIGN KEY ("internships_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_callback_background_src_id_media_id_fk" FOREIGN KEY ("callback_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_callback_background_tablet_id_media_id_fk" FOREIGN KEY ("callback_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_callback_background_desktop_id_media_id_fk" FOREIGN KEY ("callback_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_callback_form_id_forms_id_fk" FOREIGN KEY ("callback_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_car_locales" ADD CONSTRAINT "sec_car_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sec_car"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_vacancies_background_src_id_media_id_fk" FOREIGN KEY ("version_vacancies_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_vacancies_background_tablet_id_media_id_fk" FOREIGN KEY ("version_vacancies_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_vacancies_background_desktop_id_media_id_fk" FOREIGN KEY ("version_vacancies_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_internships_background_src_id_media_id_fk" FOREIGN KEY ("version_internships_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_internships_background_tablet_id_media_id_fk" FOREIGN KEY ("version_internships_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_internships_background_desktop_id_media_id_fk" FOREIGN KEY ("version_internships_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_callback_background_src_id_media_id_fk" FOREIGN KEY ("version_callback_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_callback_background_tablet_id_media_id_fk" FOREIGN KEY ("version_callback_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_callback_background_desktop_id_media_id_fk" FOREIGN KEY ("version_callback_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_version_callback_form_id_forms_id_fk" FOREIGN KEY ("version_callback_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_car_v_locales" ADD CONSTRAINT "_sec_car_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sec_car_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "sec_prt_locales" ADD CONSTRAINT "sec_prt_locales_callback_background_src_id_media_id_fk" FOREIGN KEY ("callback_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_prt_locales" ADD CONSTRAINT "sec_prt_locales_callback_background_tablet_id_media_id_fk" FOREIGN KEY ("callback_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_prt_locales" ADD CONSTRAINT "sec_prt_locales_callback_background_desktop_id_media_id_fk" FOREIGN KEY ("callback_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_prt_locales" ADD CONSTRAINT "sec_prt_locales_callback_form_id_forms_id_fk" FOREIGN KEY ("callback_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sec_prt_locales" ADD CONSTRAINT "sec_prt_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."sec_prt"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_sec_prt_v_locales" ADD CONSTRAINT "_sec_prt_v_locales_version_callback_background_src_id_media_id_fk" FOREIGN KEY ("version_callback_background_src_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_prt_v_locales" ADD CONSTRAINT "_sec_prt_v_locales_version_callback_background_tablet_id_media_id_fk" FOREIGN KEY ("version_callback_background_tablet_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_prt_v_locales" ADD CONSTRAINT "_sec_prt_v_locales_version_callback_background_desktop_id_media_id_fk" FOREIGN KEY ("version_callback_background_desktop_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_prt_v_locales" ADD CONSTRAINT "_sec_prt_v_locales_version_callback_form_id_forms_id_fk" FOREIGN KEY ("version_callback_form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_sec_prt_v_locales" ADD CONSTRAINT "_sec_prt_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_sec_prt_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "publications_cover_cover_src_idx" ON "publications" USING btree ("cover_src_id");
  CREATE INDEX "publications_cover_cover_tablet_idx" ON "publications" USING btree ("cover_tablet_id");
  CREATE INDEX "publications_cover_cover_desktop_idx" ON "publications" USING btree ("cover_desktop_id");
  CREATE INDEX "publications_background_background_src_idx" ON "publications" USING btree ("background_src_id");
  CREATE INDEX "publications_background_background_tablet_idx" ON "publications" USING btree ("background_tablet_id");
  CREATE INDEX "publications_background_background_desktop_idx" ON "publications" USING btree ("background_desktop_id");
  CREATE UNIQUE INDEX "publications_slug_idx" ON "publications" USING btree ("slug");
  CREATE INDEX "publications_updated_at_idx" ON "publications" USING btree ("updated_at");
  CREATE INDEX "publications_created_at_idx" ON "publications" USING btree ("created_at");
  CREATE INDEX "publications__status_idx" ON "publications" USING btree ("_status");
  CREATE UNIQUE INDEX "publications_locales_locale_parent_id_unique" ON "publications_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "publications_rels_order_idx" ON "publications_rels" USING btree ("order");
  CREATE INDEX "publications_rels_parent_idx" ON "publications_rels" USING btree ("parent_id");
  CREATE INDEX "publications_rels_path_idx" ON "publications_rels" USING btree ("path");
  CREATE INDEX "publications_rels_directions_id_idx" ON "publications_rels" USING btree ("directions_id");
  CREATE INDEX "publications_rels_industries_id_idx" ON "publications_rels" USING btree ("industries_id");
  CREATE INDEX "publications_rels_terms_id_idx" ON "publications_rels" USING btree ("terms_id");
  CREATE INDEX "publications_rels_services_id_idx" ON "publications_rels" USING btree ("services_id");
  CREATE INDEX "publications_rels_publications_id_idx" ON "publications_rels" USING btree ("publications_id");
  CREATE INDEX "_publications_v_parent_idx" ON "_publications_v" USING btree ("parent_id");
  CREATE INDEX "_publications_v_version_cover_version_cover_src_idx" ON "_publications_v" USING btree ("version_cover_src_id");
  CREATE INDEX "_publications_v_version_cover_version_cover_tablet_idx" ON "_publications_v" USING btree ("version_cover_tablet_id");
  CREATE INDEX "_publications_v_version_cover_version_cover_desktop_idx" ON "_publications_v" USING btree ("version_cover_desktop_id");
  CREATE INDEX "_publications_v_version_background_version_background_sr_idx" ON "_publications_v" USING btree ("version_background_src_id");
  CREATE INDEX "_publications_v_version_background_version_background_ta_idx" ON "_publications_v" USING btree ("version_background_tablet_id");
  CREATE INDEX "_publications_v_version_background_version_background_de_idx" ON "_publications_v" USING btree ("version_background_desktop_id");
  CREATE INDEX "_publications_v_version_version_slug_idx" ON "_publications_v" USING btree ("version_slug");
  CREATE INDEX "_publications_v_version_version_updated_at_idx" ON "_publications_v" USING btree ("version_updated_at");
  CREATE INDEX "_publications_v_version_version_created_at_idx" ON "_publications_v" USING btree ("version_created_at");
  CREATE INDEX "_publications_v_version_version__status_idx" ON "_publications_v" USING btree ("version__status");
  CREATE INDEX "_publications_v_created_at_idx" ON "_publications_v" USING btree ("created_at");
  CREATE INDEX "_publications_v_updated_at_idx" ON "_publications_v" USING btree ("updated_at");
  CREATE INDEX "_publications_v_snapshot_idx" ON "_publications_v" USING btree ("snapshot");
  CREATE INDEX "_publications_v_published_locale_idx" ON "_publications_v" USING btree ("published_locale");
  CREATE INDEX "_publications_v_latest_idx" ON "_publications_v" USING btree ("latest");
  CREATE INDEX "_publications_v_autosave_idx" ON "_publications_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_publications_v_locales_locale_parent_id_unique" ON "_publications_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_publications_v_rels_order_idx" ON "_publications_v_rels" USING btree ("order");
  CREATE INDEX "_publications_v_rels_parent_idx" ON "_publications_v_rels" USING btree ("parent_id");
  CREATE INDEX "_publications_v_rels_path_idx" ON "_publications_v_rels" USING btree ("path");
  CREATE INDEX "_publications_v_rels_directions_id_idx" ON "_publications_v_rels" USING btree ("directions_id");
  CREATE INDEX "_publications_v_rels_industries_id_idx" ON "_publications_v_rels" USING btree ("industries_id");
  CREATE INDEX "_publications_v_rels_terms_id_idx" ON "_publications_v_rels" USING btree ("terms_id");
  CREATE INDEX "_publications_v_rels_services_id_idx" ON "_publications_v_rels" USING btree ("services_id");
  CREATE INDEX "_publications_v_rels_publications_id_idx" ON "_publications_v_rels" USING btree ("publications_id");
  CREATE INDEX "projects_stats_order_idx" ON "projects_stats" USING btree ("_order");
  CREATE INDEX "projects_stats_parent_id_idx" ON "projects_stats" USING btree ("_parent_id");
  CREATE INDEX "projects_stats_locale_idx" ON "projects_stats" USING btree ("_locale");
  CREATE INDEX "projects_company_company_src_idx" ON "projects" USING btree ("company_src_id");
  CREATE INDEX "projects_company_company_tablet_idx" ON "projects" USING btree ("company_tablet_id");
  CREATE INDEX "projects_company_company_desktop_idx" ON "projects" USING btree ("company_desktop_id");
  CREATE INDEX "projects_updated_at_idx" ON "projects" USING btree ("updated_at");
  CREATE INDEX "projects_created_at_idx" ON "projects" USING btree ("created_at");
  CREATE INDEX "projects__status_idx" ON "projects" USING btree ("_status");
  CREATE UNIQUE INDEX "projects_locales_locale_parent_id_unique" ON "projects_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "projects_rels_order_idx" ON "projects_rels" USING btree ("order");
  CREATE INDEX "projects_rels_parent_idx" ON "projects_rels" USING btree ("parent_id");
  CREATE INDEX "projects_rels_path_idx" ON "projects_rels" USING btree ("path");
  CREATE INDEX "projects_rels_directions_id_idx" ON "projects_rels" USING btree ("directions_id");
  CREATE INDEX "projects_rels_industries_id_idx" ON "projects_rels" USING btree ("industries_id");
  CREATE INDEX "_projects_v_version_stats_order_idx" ON "_projects_v_version_stats" USING btree ("_order");
  CREATE INDEX "_projects_v_version_stats_parent_id_idx" ON "_projects_v_version_stats" USING btree ("_parent_id");
  CREATE INDEX "_projects_v_version_stats_locale_idx" ON "_projects_v_version_stats" USING btree ("_locale");
  CREATE INDEX "_projects_v_parent_idx" ON "_projects_v" USING btree ("parent_id");
  CREATE INDEX "_projects_v_version_company_version_company_src_idx" ON "_projects_v" USING btree ("version_company_src_id");
  CREATE INDEX "_projects_v_version_company_version_company_tablet_idx" ON "_projects_v" USING btree ("version_company_tablet_id");
  CREATE INDEX "_projects_v_version_company_version_company_desktop_idx" ON "_projects_v" USING btree ("version_company_desktop_id");
  CREATE INDEX "_projects_v_version_version_updated_at_idx" ON "_projects_v" USING btree ("version_updated_at");
  CREATE INDEX "_projects_v_version_version_created_at_idx" ON "_projects_v" USING btree ("version_created_at");
  CREATE INDEX "_projects_v_version_version__status_idx" ON "_projects_v" USING btree ("version__status");
  CREATE INDEX "_projects_v_created_at_idx" ON "_projects_v" USING btree ("created_at");
  CREATE INDEX "_projects_v_updated_at_idx" ON "_projects_v" USING btree ("updated_at");
  CREATE INDEX "_projects_v_snapshot_idx" ON "_projects_v" USING btree ("snapshot");
  CREATE INDEX "_projects_v_published_locale_idx" ON "_projects_v" USING btree ("published_locale");
  CREATE INDEX "_projects_v_latest_idx" ON "_projects_v" USING btree ("latest");
  CREATE INDEX "_projects_v_autosave_idx" ON "_projects_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_projects_v_locales_locale_parent_id_unique" ON "_projects_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_projects_v_rels_order_idx" ON "_projects_v_rels" USING btree ("order");
  CREATE INDEX "_projects_v_rels_parent_idx" ON "_projects_v_rels" USING btree ("parent_id");
  CREATE INDEX "_projects_v_rels_path_idx" ON "_projects_v_rels" USING btree ("path");
  CREATE INDEX "_projects_v_rels_directions_id_idx" ON "_projects_v_rels" USING btree ("directions_id");
  CREATE INDEX "_projects_v_rels_industries_id_idx" ON "_projects_v_rels" USING btree ("industries_id");
  CREATE INDEX "services_direction_idx" ON "services" USING btree ("direction_id");
  CREATE INDEX "services_subdirection_idx" ON "services" USING btree ("subdirection_id");
  CREATE UNIQUE INDEX "services_slug_idx" ON "services" USING btree ("slug");
  CREATE INDEX "services_updated_at_idx" ON "services" USING btree ("updated_at");
  CREATE INDEX "services_created_at_idx" ON "services" USING btree ("created_at");
  CREATE UNIQUE INDEX "services_locales_locale_parent_id_unique" ON "services_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "services_rels_order_idx" ON "services_rels" USING btree ("order");
  CREATE INDEX "services_rels_parent_idx" ON "services_rels" USING btree ("parent_id");
  CREATE INDEX "services_rels_path_idx" ON "services_rels" USING btree ("path");
  CREATE INDEX "services_rels_industries_id_idx" ON "services_rels" USING btree ("industries_id");
  CREATE INDEX "directions_logos_order_idx" ON "directions_logos" USING btree ("_order");
  CREATE INDEX "directions_logos_parent_id_idx" ON "directions_logos" USING btree ("_parent_id");
  CREATE INDEX "directions_logos_src_idx" ON "directions_logos" USING btree ("src_id");
  CREATE INDEX "directions_logos_tablet_idx" ON "directions_logos" USING btree ("tablet_id");
  CREATE INDEX "directions_logos_desktop_idx" ON "directions_logos" USING btree ("desktop_id");
  CREATE INDEX "directions_center_idx" ON "directions" USING btree ("center_id");
  CREATE INDEX "directions_image_image_src_idx" ON "directions" USING btree ("image_src_id");
  CREATE INDEX "directions_image_image_tablet_idx" ON "directions" USING btree ("image_tablet_id");
  CREATE INDEX "directions_image_image_desktop_idx" ON "directions" USING btree ("image_desktop_id");
  CREATE UNIQUE INDEX "directions_code_idx" ON "directions" USING btree ("code");
  CREATE INDEX "directions_page_idx" ON "directions" USING btree ("page_id");
  CREATE INDEX "directions_updated_at_idx" ON "directions" USING btree ("updated_at");
  CREATE INDEX "directions_created_at_idx" ON "directions" USING btree ("created_at");
  CREATE UNIQUE INDEX "directions_locales_locale_parent_id_unique" ON "directions_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "subdirections_direction_idx" ON "subdirections" USING btree ("direction_id");
  CREATE INDEX "subdirections_updated_at_idx" ON "subdirections" USING btree ("updated_at");
  CREATE INDEX "subdirections_created_at_idx" ON "subdirections" USING btree ("created_at");
  CREATE UNIQUE INDEX "subdirections_locales_locale_parent_id_unique" ON "subdirections_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "industries_metrics_order_idx" ON "industries_metrics" USING btree ("_order");
  CREATE INDEX "industries_metrics_parent_id_idx" ON "industries_metrics" USING btree ("_parent_id");
  CREATE INDEX "industries_metrics_locale_idx" ON "industries_metrics" USING btree ("_locale");
  CREATE INDEX "industries_logos_order_idx" ON "industries_logos" USING btree ("_order");
  CREATE INDEX "industries_logos_parent_id_idx" ON "industries_logos" USING btree ("_parent_id");
  CREATE INDEX "industries_logos_src_idx" ON "industries_logos" USING btree ("src_id");
  CREATE INDEX "industries_logos_tablet_idx" ON "industries_logos" USING btree ("tablet_id");
  CREATE INDEX "industries_logos_desktop_idx" ON "industries_logos" USING btree ("desktop_id");
  CREATE UNIQUE INDEX "industries_code_idx" ON "industries" USING btree ("code");
  CREATE INDEX "industries_page_idx" ON "industries" USING btree ("page_id");
  CREATE INDEX "industries_updated_at_idx" ON "industries" USING btree ("updated_at");
  CREATE INDEX "industries_created_at_idx" ON "industries" USING btree ("created_at");
  CREATE UNIQUE INDEX "industries_locales_locale_parent_id_unique" ON "industries_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "vacancies_about_direction_items_order_idx" ON "vacancies_about_direction_items" USING btree ("_order");
  CREATE INDEX "vacancies_about_direction_items_parent_id_idx" ON "vacancies_about_direction_items" USING btree ("_parent_id");
  CREATE INDEX "vacancies_about_direction_items_locale_idx" ON "vacancies_about_direction_items" USING btree ("_locale");
  CREATE INDEX "vacancies_about_vacancy_items_subitems_order_idx" ON "vacancies_about_vacancy_items_subitems" USING btree ("_order");
  CREATE INDEX "vacancies_about_vacancy_items_subitems_parent_id_idx" ON "vacancies_about_vacancy_items_subitems" USING btree ("_parent_id");
  CREATE INDEX "vacancies_about_vacancy_items_subitems_locale_idx" ON "vacancies_about_vacancy_items_subitems" USING btree ("_locale");
  CREATE INDEX "vacancies_about_vacancy_items_order_idx" ON "vacancies_about_vacancy_items" USING btree ("_order");
  CREATE INDEX "vacancies_about_vacancy_items_parent_id_idx" ON "vacancies_about_vacancy_items" USING btree ("_parent_id");
  CREATE INDEX "vacancies_about_vacancy_items_locale_idx" ON "vacancies_about_vacancy_items" USING btree ("_locale");
  CREATE INDEX "vacancies_about_vacancy_items_img_img_src_idx" ON "vacancies_about_vacancy_items" USING btree ("img_src_id");
  CREATE INDEX "vacancies_about_vacancy_items_img_img_tablet_idx" ON "vacancies_about_vacancy_items" USING btree ("img_tablet_id");
  CREATE INDEX "vacancies_about_vacancy_items_img_img_desktop_idx" ON "vacancies_about_vacancy_items" USING btree ("img_desktop_id");
  CREATE INDEX "vacancies_be_plus_items_subitems_order_idx" ON "vacancies_be_plus_items_subitems" USING btree ("_order");
  CREATE INDEX "vacancies_be_plus_items_subitems_parent_id_idx" ON "vacancies_be_plus_items_subitems" USING btree ("_parent_id");
  CREATE INDEX "vacancies_be_plus_items_subitems_locale_idx" ON "vacancies_be_plus_items_subitems" USING btree ("_locale");
  CREATE INDEX "vacancies_be_plus_items_order_idx" ON "vacancies_be_plus_items" USING btree ("_order");
  CREATE INDEX "vacancies_be_plus_items_parent_id_idx" ON "vacancies_be_plus_items" USING btree ("_parent_id");
  CREATE INDEX "vacancies_be_plus_items_locale_idx" ON "vacancies_be_plus_items" USING btree ("_locale");
  CREATE INDEX "vacancies_be_plus_items_img_img_src_idx" ON "vacancies_be_plus_items" USING btree ("img_src_id");
  CREATE INDEX "vacancies_be_plus_items_img_img_tablet_idx" ON "vacancies_be_plus_items" USING btree ("img_tablet_id");
  CREATE INDEX "vacancies_be_plus_items_img_img_desktop_idx" ON "vacancies_be_plus_items" USING btree ("img_desktop_id");
  CREATE INDEX "vacancies_advantages_items_order_idx" ON "vacancies_advantages_items" USING btree ("_order");
  CREATE INDEX "vacancies_advantages_items_parent_id_idx" ON "vacancies_advantages_items" USING btree ("_parent_id");
  CREATE INDEX "vacancies_advantages_items_locale_idx" ON "vacancies_advantages_items" USING btree ("_locale");
  CREATE INDEX "vacancies_faq_items_order_idx" ON "vacancies_faq_items" USING btree ("_order");
  CREATE INDEX "vacancies_faq_items_parent_id_idx" ON "vacancies_faq_items" USING btree ("_parent_id");
  CREATE INDEX "vacancies_faq_items_locale_idx" ON "vacancies_faq_items" USING btree ("_locale");
  CREATE INDEX "vacancies_reviews_items_order_idx" ON "vacancies_reviews_items" USING btree ("_order");
  CREATE INDEX "vacancies_reviews_items_parent_id_idx" ON "vacancies_reviews_items" USING btree ("_parent_id");
  CREATE INDEX "vacancies_reviews_items_locale_idx" ON "vacancies_reviews_items" USING btree ("_locale");
  CREATE INDEX "vacancies_reviews_items_person_img_person_img_src_idx" ON "vacancies_reviews_items" USING btree ("person_img_src_id");
  CREATE INDEX "vacancies_reviews_items_person_img_person_img_tablet_idx" ON "vacancies_reviews_items" USING btree ("person_img_tablet_id");
  CREATE INDEX "vacancies_reviews_items_person_img_person_img_desktop_idx" ON "vacancies_reviews_items" USING btree ("person_img_desktop_id");
  CREATE INDEX "vacancies_tag_idx" ON "vacancies" USING btree ("tag_id");
  CREATE INDEX "vacancies_city_idx" ON "vacancies" USING btree ("city_id");
  CREATE INDEX "vacancies_experience_idx" ON "vacancies" USING btree ("experience_id");
  CREATE INDEX "vacancies_work_format_idx" ON "vacancies" USING btree ("work_format_id");
  CREATE INDEX "vacancies_background_background_src_idx" ON "vacancies" USING btree ("background_src_id");
  CREATE INDEX "vacancies_background_background_tablet_idx" ON "vacancies" USING btree ("background_tablet_id");
  CREATE INDEX "vacancies_background_background_desktop_idx" ON "vacancies" USING btree ("background_desktop_id");
  CREATE UNIQUE INDEX "vacancies_slug_idx" ON "vacancies" USING btree ("slug");
  CREATE INDEX "vacancies_updated_at_idx" ON "vacancies" USING btree ("updated_at");
  CREATE INDEX "vacancies_created_at_idx" ON "vacancies" USING btree ("created_at");
  CREATE INDEX "vacancies__status_idx" ON "vacancies" USING btree ("_status");
  CREATE UNIQUE INDEX "vacancies_locales_locale_parent_id_unique" ON "vacancies_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "vacancies_rels_order_idx" ON "vacancies_rels" USING btree ("order");
  CREATE INDEX "vacancies_rels_parent_idx" ON "vacancies_rels" USING btree ("parent_id");
  CREATE INDEX "vacancies_rels_path_idx" ON "vacancies_rels" USING btree ("path");
  CREATE INDEX "vacancies_rels_vacancies_id_idx" ON "vacancies_rels" USING btree ("vacancies_id");
  CREATE INDEX "_vacancies_v_version_about_direction_items_order_idx" ON "_vacancies_v_version_about_direction_items" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_about_direction_items_parent_id_idx" ON "_vacancies_v_version_about_direction_items" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_about_direction_items_locale_idx" ON "_vacancies_v_version_about_direction_items" USING btree ("_locale");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_subitems_order_idx" ON "_vacancies_v_version_about_vacancy_items_subitems" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_subitems_parent_id_idx" ON "_vacancies_v_version_about_vacancy_items_subitems" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_subitems_locale_idx" ON "_vacancies_v_version_about_vacancy_items_subitems" USING btree ("_locale");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_order_idx" ON "_vacancies_v_version_about_vacancy_items" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_parent_id_idx" ON "_vacancies_v_version_about_vacancy_items" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_locale_idx" ON "_vacancies_v_version_about_vacancy_items" USING btree ("_locale");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_img_img_src_idx" ON "_vacancies_v_version_about_vacancy_items" USING btree ("img_src_id");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_img_img_tablet_idx" ON "_vacancies_v_version_about_vacancy_items" USING btree ("img_tablet_id");
  CREATE INDEX "_vacancies_v_version_about_vacancy_items_img_img_desktop_idx" ON "_vacancies_v_version_about_vacancy_items" USING btree ("img_desktop_id");
  CREATE INDEX "_vacancies_v_version_be_plus_items_subitems_order_idx" ON "_vacancies_v_version_be_plus_items_subitems" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_be_plus_items_subitems_parent_id_idx" ON "_vacancies_v_version_be_plus_items_subitems" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_be_plus_items_subitems_locale_idx" ON "_vacancies_v_version_be_plus_items_subitems" USING btree ("_locale");
  CREATE INDEX "_vacancies_v_version_be_plus_items_order_idx" ON "_vacancies_v_version_be_plus_items" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_be_plus_items_parent_id_idx" ON "_vacancies_v_version_be_plus_items" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_be_plus_items_locale_idx" ON "_vacancies_v_version_be_plus_items" USING btree ("_locale");
  CREATE INDEX "_vacancies_v_version_be_plus_items_img_img_src_idx" ON "_vacancies_v_version_be_plus_items" USING btree ("img_src_id");
  CREATE INDEX "_vacancies_v_version_be_plus_items_img_img_tablet_idx" ON "_vacancies_v_version_be_plus_items" USING btree ("img_tablet_id");
  CREATE INDEX "_vacancies_v_version_be_plus_items_img_img_desktop_idx" ON "_vacancies_v_version_be_plus_items" USING btree ("img_desktop_id");
  CREATE INDEX "_vacancies_v_version_advantages_items_order_idx" ON "_vacancies_v_version_advantages_items" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_advantages_items_parent_id_idx" ON "_vacancies_v_version_advantages_items" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_advantages_items_locale_idx" ON "_vacancies_v_version_advantages_items" USING btree ("_locale");
  CREATE INDEX "_vacancies_v_version_faq_items_order_idx" ON "_vacancies_v_version_faq_items" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_faq_items_parent_id_idx" ON "_vacancies_v_version_faq_items" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_faq_items_locale_idx" ON "_vacancies_v_version_faq_items" USING btree ("_locale");
  CREATE INDEX "_vacancies_v_version_reviews_items_order_idx" ON "_vacancies_v_version_reviews_items" USING btree ("_order");
  CREATE INDEX "_vacancies_v_version_reviews_items_parent_id_idx" ON "_vacancies_v_version_reviews_items" USING btree ("_parent_id");
  CREATE INDEX "_vacancies_v_version_reviews_items_locale_idx" ON "_vacancies_v_version_reviews_items" USING btree ("_locale");
  CREATE INDEX "_vacancies_v_version_reviews_items_person_img_person_img_idx" ON "_vacancies_v_version_reviews_items" USING btree ("person_img_src_id");
  CREATE INDEX "_vacancies_v_version_reviews_items_person_img_person_i_1_idx" ON "_vacancies_v_version_reviews_items" USING btree ("person_img_tablet_id");
  CREATE INDEX "_vacancies_v_version_reviews_items_person_img_person_i_2_idx" ON "_vacancies_v_version_reviews_items" USING btree ("person_img_desktop_id");
  CREATE INDEX "_vacancies_v_parent_idx" ON "_vacancies_v" USING btree ("parent_id");
  CREATE INDEX "_vacancies_v_version_version_tag_idx" ON "_vacancies_v" USING btree ("version_tag_id");
  CREATE INDEX "_vacancies_v_version_version_city_idx" ON "_vacancies_v" USING btree ("version_city_id");
  CREATE INDEX "_vacancies_v_version_version_experience_idx" ON "_vacancies_v" USING btree ("version_experience_id");
  CREATE INDEX "_vacancies_v_version_version_work_format_idx" ON "_vacancies_v" USING btree ("version_work_format_id");
  CREATE INDEX "_vacancies_v_version_background_version_background_src_idx" ON "_vacancies_v" USING btree ("version_background_src_id");
  CREATE INDEX "_vacancies_v_version_background_version_background_table_idx" ON "_vacancies_v" USING btree ("version_background_tablet_id");
  CREATE INDEX "_vacancies_v_version_background_version_background_deskt_idx" ON "_vacancies_v" USING btree ("version_background_desktop_id");
  CREATE INDEX "_vacancies_v_version_version_slug_idx" ON "_vacancies_v" USING btree ("version_slug");
  CREATE INDEX "_vacancies_v_version_version_updated_at_idx" ON "_vacancies_v" USING btree ("version_updated_at");
  CREATE INDEX "_vacancies_v_version_version_created_at_idx" ON "_vacancies_v" USING btree ("version_created_at");
  CREATE INDEX "_vacancies_v_version_version__status_idx" ON "_vacancies_v" USING btree ("version__status");
  CREATE INDEX "_vacancies_v_created_at_idx" ON "_vacancies_v" USING btree ("created_at");
  CREATE INDEX "_vacancies_v_updated_at_idx" ON "_vacancies_v" USING btree ("updated_at");
  CREATE INDEX "_vacancies_v_snapshot_idx" ON "_vacancies_v" USING btree ("snapshot");
  CREATE INDEX "_vacancies_v_published_locale_idx" ON "_vacancies_v" USING btree ("published_locale");
  CREATE INDEX "_vacancies_v_latest_idx" ON "_vacancies_v" USING btree ("latest");
  CREATE INDEX "_vacancies_v_autosave_idx" ON "_vacancies_v" USING btree ("autosave");
  CREATE UNIQUE INDEX "_vacancies_v_locales_locale_parent_id_unique" ON "_vacancies_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_vacancies_v_rels_order_idx" ON "_vacancies_v_rels" USING btree ("order");
  CREATE INDEX "_vacancies_v_rels_parent_idx" ON "_vacancies_v_rels" USING btree ("parent_id");
  CREATE INDEX "_vacancies_v_rels_path_idx" ON "_vacancies_v_rels" USING btree ("path");
  CREATE INDEX "_vacancies_v_rels_vacancies_id_idx" ON "_vacancies_v_rels" USING btree ("vacancies_id");
  CREATE INDEX "partners_items_order_idx" ON "partners_items" USING btree ("_order");
  CREATE INDEX "partners_items_parent_id_idx" ON "partners_items" USING btree ("_parent_id");
  CREATE INDEX "partners_items_locale_idx" ON "partners_items" USING btree ("_locale");
  CREATE INDEX "partners_logo_logo_src_idx" ON "partners" USING btree ("logo_src_id");
  CREATE INDEX "partners_logo_logo_tablet_idx" ON "partners" USING btree ("logo_tablet_id");
  CREATE INDEX "partners_logo_logo_desktop_idx" ON "partners" USING btree ("logo_desktop_id");
  CREATE INDEX "partners_type_idx" ON "partners" USING btree ("type_id");
  CREATE INDEX "partners_updated_at_idx" ON "partners" USING btree ("updated_at");
  CREATE INDEX "partners_created_at_idx" ON "partners" USING btree ("created_at");
  CREATE UNIQUE INDEX "partners_locales_locale_parent_id_unique" ON "partners_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "partners_rels_order_idx" ON "partners_rels" USING btree ("order");
  CREATE INDEX "partners_rels_parent_idx" ON "partners_rels" USING btree ("parent_id");
  CREATE INDEX "partners_rels_path_idx" ON "partners_rels" USING btree ("path");
  CREATE INDEX "partners_rels_directions_id_idx" ON "partners_rels" USING btree ("directions_id");
  CREATE INDEX "terms_kind_idx" ON "terms" USING btree ("kind");
  CREATE INDEX "terms_code_idx" ON "terms" USING btree ("code");
  CREATE INDEX "terms_updated_at_idx" ON "terms" USING btree ("updated_at");
  CREATE INDEX "terms_created_at_idx" ON "terms" USING btree ("created_at");
  CREATE UNIQUE INDEX "terms_locales_locale_parent_id_unique" ON "terms_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sec_xp_expertise_elector_background_expertise_elector_ba_idx" ON "sec_xp_locales" USING btree ("expertise_elector_background_src_id");
  CREATE INDEX "sec_xp_expertise_elector_background_expertise_elector__1_idx" ON "sec_xp_locales" USING btree ("expertise_elector_background_tablet_id");
  CREATE INDEX "sec_xp_expertise_elector_background_expertise_elector__2_idx" ON "sec_xp_locales" USING btree ("expertise_elector_background_desktop_id");
  CREATE INDEX "sec_xp_callback_background_callback_background_src_idx" ON "sec_xp_locales" USING btree ("callback_background_src_id");
  CREATE INDEX "sec_xp_callback_background_callback_background_tablet_idx" ON "sec_xp_locales" USING btree ("callback_background_tablet_id");
  CREATE INDEX "sec_xp_callback_background_callback_background_desktop_idx" ON "sec_xp_locales" USING btree ("callback_background_desktop_id");
  CREATE INDEX "sec_xp_callback_callback_form_idx" ON "sec_xp_locales" USING btree ("callback_form_id");
  CREATE INDEX "sec_xp_journal_img_journal_img_src_idx" ON "sec_xp_locales" USING btree ("journal_img_src_id");
  CREATE INDEX "sec_xp_journal_img_journal_img_tablet_idx" ON "sec_xp_locales" USING btree ("journal_img_tablet_id");
  CREATE INDEX "sec_xp_journal_img_journal_img_desktop_idx" ON "sec_xp_locales" USING btree ("journal_img_desktop_id");
  CREATE INDEX "sec_xp_journal_background_journal_background_src_idx" ON "sec_xp_locales" USING btree ("journal_background_src_id");
  CREATE INDEX "sec_xp_journal_background_journal_background_tablet_idx" ON "sec_xp_locales" USING btree ("journal_background_tablet_id");
  CREATE INDEX "sec_xp_journal_background_journal_background_desktop_idx" ON "sec_xp_locales" USING btree ("journal_background_desktop_id");
  CREATE UNIQUE INDEX "sec_xp_locales_locale_parent_id_unique" ON "sec_xp_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sec_xp_v_created_at_idx" ON "_sec_xp_v" USING btree ("created_at");
  CREATE INDEX "_sec_xp_v_updated_at_idx" ON "_sec_xp_v" USING btree ("updated_at");
  CREATE INDEX "_sec_xp_v_version_expertise_elector_background_version_e_idx" ON "_sec_xp_v_locales" USING btree ("version_expertise_elector_background_src_id");
  CREATE INDEX "_sec_xp_v_version_expertise_elector_background_version_1_idx" ON "_sec_xp_v_locales" USING btree ("version_expertise_elector_background_tablet_id");
  CREATE INDEX "_sec_xp_v_version_expertise_elector_background_version_2_idx" ON "_sec_xp_v_locales" USING btree ("version_expertise_elector_background_desktop_id");
  CREATE INDEX "_sec_xp_v_version_callback_background_version_callback_b_idx" ON "_sec_xp_v_locales" USING btree ("version_callback_background_src_id");
  CREATE INDEX "_sec_xp_v_version_callback_background_version_callback_1_idx" ON "_sec_xp_v_locales" USING btree ("version_callback_background_tablet_id");
  CREATE INDEX "_sec_xp_v_version_callback_background_version_callback_2_idx" ON "_sec_xp_v_locales" USING btree ("version_callback_background_desktop_id");
  CREATE INDEX "_sec_xp_v_version_callback_version_callback_form_idx" ON "_sec_xp_v_locales" USING btree ("version_callback_form_id");
  CREATE INDEX "_sec_xp_v_version_journal_img_version_journal_img_src_idx" ON "_sec_xp_v_locales" USING btree ("version_journal_img_src_id");
  CREATE INDEX "_sec_xp_v_version_journal_img_version_journal_img_tablet_idx" ON "_sec_xp_v_locales" USING btree ("version_journal_img_tablet_id");
  CREATE INDEX "_sec_xp_v_version_journal_img_version_journal_img_deskto_idx" ON "_sec_xp_v_locales" USING btree ("version_journal_img_desktop_id");
  CREATE INDEX "_sec_xp_v_version_journal_background_version_journal_bac_idx" ON "_sec_xp_v_locales" USING btree ("version_journal_background_src_id");
  CREATE INDEX "_sec_xp_v_version_journal_background_version_journal_b_1_idx" ON "_sec_xp_v_locales" USING btree ("version_journal_background_tablet_id");
  CREATE INDEX "_sec_xp_v_version_journal_background_version_journal_b_2_idx" ON "_sec_xp_v_locales" USING btree ("version_journal_background_desktop_id");
  CREATE UNIQUE INDEX "_sec_xp_v_locales_locale_parent_id_unique" ON "_sec_xp_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sec_cat_catalog_background_catalog_background_src_idx" ON "sec_cat_locales" USING btree ("catalog_background_src_id");
  CREATE INDEX "sec_cat_catalog_background_catalog_background_tablet_idx" ON "sec_cat_locales" USING btree ("catalog_background_tablet_id");
  CREATE INDEX "sec_cat_catalog_background_catalog_background_desktop_idx" ON "sec_cat_locales" USING btree ("catalog_background_desktop_id");
  CREATE INDEX "sec_cat_callback_background_callback_background_src_idx" ON "sec_cat_locales" USING btree ("callback_background_src_id");
  CREATE INDEX "sec_cat_callback_background_callback_background_tablet_idx" ON "sec_cat_locales" USING btree ("callback_background_tablet_id");
  CREATE INDEX "sec_cat_callback_background_callback_background_desktop_idx" ON "sec_cat_locales" USING btree ("callback_background_desktop_id");
  CREATE INDEX "sec_cat_callback_callback_form_idx" ON "sec_cat_locales" USING btree ("callback_form_id");
  CREATE UNIQUE INDEX "sec_cat_locales_locale_parent_id_unique" ON "sec_cat_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sec_cat_v_created_at_idx" ON "_sec_cat_v" USING btree ("created_at");
  CREATE INDEX "_sec_cat_v_updated_at_idx" ON "_sec_cat_v" USING btree ("updated_at");
  CREATE INDEX "_sec_cat_v_version_catalog_background_version_catalog_ba_idx" ON "_sec_cat_v_locales" USING btree ("version_catalog_background_src_id");
  CREATE INDEX "_sec_cat_v_version_catalog_background_version_catalog__1_idx" ON "_sec_cat_v_locales" USING btree ("version_catalog_background_tablet_id");
  CREATE INDEX "_sec_cat_v_version_catalog_background_version_catalog__2_idx" ON "_sec_cat_v_locales" USING btree ("version_catalog_background_desktop_id");
  CREATE INDEX "_sec_cat_v_version_callback_background_version_callback__idx" ON "_sec_cat_v_locales" USING btree ("version_callback_background_src_id");
  CREATE INDEX "_sec_cat_v_version_callback_background_version_callbac_1_idx" ON "_sec_cat_v_locales" USING btree ("version_callback_background_tablet_id");
  CREATE INDEX "_sec_cat_v_version_callback_background_version_callbac_2_idx" ON "_sec_cat_v_locales" USING btree ("version_callback_background_desktop_id");
  CREATE INDEX "_sec_cat_v_version_callback_version_callback_form_idx" ON "_sec_cat_v_locales" USING btree ("version_callback_form_id");
  CREATE UNIQUE INDEX "_sec_cat_v_locales_locale_parent_id_unique" ON "_sec_cat_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sec_car_vacancies_background_vacancies_background_src_idx" ON "sec_car_locales" USING btree ("vacancies_background_src_id");
  CREATE INDEX "sec_car_vacancies_background_vacancies_background_tablet_idx" ON "sec_car_locales" USING btree ("vacancies_background_tablet_id");
  CREATE INDEX "sec_car_vacancies_background_vacancies_background_deskto_idx" ON "sec_car_locales" USING btree ("vacancies_background_desktop_id");
  CREATE INDEX "sec_car_internships_background_internships_background_sr_idx" ON "sec_car_locales" USING btree ("internships_background_src_id");
  CREATE INDEX "sec_car_internships_background_internships_background_ta_idx" ON "sec_car_locales" USING btree ("internships_background_tablet_id");
  CREATE INDEX "sec_car_internships_background_internships_background_de_idx" ON "sec_car_locales" USING btree ("internships_background_desktop_id");
  CREATE INDEX "sec_car_callback_background_callback_background_src_idx" ON "sec_car_locales" USING btree ("callback_background_src_id");
  CREATE INDEX "sec_car_callback_background_callback_background_tablet_idx" ON "sec_car_locales" USING btree ("callback_background_tablet_id");
  CREATE INDEX "sec_car_callback_background_callback_background_desktop_idx" ON "sec_car_locales" USING btree ("callback_background_desktop_id");
  CREATE INDEX "sec_car_callback_callback_form_idx" ON "sec_car_locales" USING btree ("callback_form_id");
  CREATE UNIQUE INDEX "sec_car_locales_locale_parent_id_unique" ON "sec_car_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sec_car_v_created_at_idx" ON "_sec_car_v" USING btree ("created_at");
  CREATE INDEX "_sec_car_v_updated_at_idx" ON "_sec_car_v" USING btree ("updated_at");
  CREATE INDEX "_sec_car_v_version_vacancies_background_version_vacancie_idx" ON "_sec_car_v_locales" USING btree ("version_vacancies_background_src_id");
  CREATE INDEX "_sec_car_v_version_vacancies_background_version_vacanc_1_idx" ON "_sec_car_v_locales" USING btree ("version_vacancies_background_tablet_id");
  CREATE INDEX "_sec_car_v_version_vacancies_background_version_vacanc_2_idx" ON "_sec_car_v_locales" USING btree ("version_vacancies_background_desktop_id");
  CREATE INDEX "_sec_car_v_version_internships_background_version_intern_idx" ON "_sec_car_v_locales" USING btree ("version_internships_background_src_id");
  CREATE INDEX "_sec_car_v_version_internships_background_version_inte_1_idx" ON "_sec_car_v_locales" USING btree ("version_internships_background_tablet_id");
  CREATE INDEX "_sec_car_v_version_internships_background_version_inte_2_idx" ON "_sec_car_v_locales" USING btree ("version_internships_background_desktop_id");
  CREATE INDEX "_sec_car_v_version_callback_background_version_callback__idx" ON "_sec_car_v_locales" USING btree ("version_callback_background_src_id");
  CREATE INDEX "_sec_car_v_version_callback_background_version_callbac_1_idx" ON "_sec_car_v_locales" USING btree ("version_callback_background_tablet_id");
  CREATE INDEX "_sec_car_v_version_callback_background_version_callbac_2_idx" ON "_sec_car_v_locales" USING btree ("version_callback_background_desktop_id");
  CREATE INDEX "_sec_car_v_version_callback_version_callback_form_idx" ON "_sec_car_v_locales" USING btree ("version_callback_form_id");
  CREATE UNIQUE INDEX "_sec_car_v_locales_locale_parent_id_unique" ON "_sec_car_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "sec_prt_callback_background_callback_background_src_idx" ON "sec_prt_locales" USING btree ("callback_background_src_id");
  CREATE INDEX "sec_prt_callback_background_callback_background_tablet_idx" ON "sec_prt_locales" USING btree ("callback_background_tablet_id");
  CREATE INDEX "sec_prt_callback_background_callback_background_desktop_idx" ON "sec_prt_locales" USING btree ("callback_background_desktop_id");
  CREATE INDEX "sec_prt_callback_callback_form_idx" ON "sec_prt_locales" USING btree ("callback_form_id");
  CREATE UNIQUE INDEX "sec_prt_locales_locale_parent_id_unique" ON "sec_prt_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_sec_prt_v_created_at_idx" ON "_sec_prt_v" USING btree ("created_at");
  CREATE INDEX "_sec_prt_v_updated_at_idx" ON "_sec_prt_v" USING btree ("updated_at");
  CREATE INDEX "_sec_prt_v_version_callback_background_version_callback__idx" ON "_sec_prt_v_locales" USING btree ("version_callback_background_src_id");
  CREATE INDEX "_sec_prt_v_version_callback_background_version_callbac_1_idx" ON "_sec_prt_v_locales" USING btree ("version_callback_background_tablet_id");
  CREATE INDEX "_sec_prt_v_version_callback_background_version_callbac_2_idx" ON "_sec_prt_v_locales" USING btree ("version_callback_background_desktop_id");
  CREATE INDEX "_sec_prt_v_version_callback_version_callback_form_idx" ON "_sec_prt_v_locales" USING btree ("version_callback_form_id");
  CREATE UNIQUE INDEX "_sec_prt_v_locales_locale_parent_id_unique" ON "_sec_prt_v_locales" USING btree ("_locale","_parent_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_publications_fk" FOREIGN KEY ("publications_id") REFERENCES "public"."publications"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_projects_fk" FOREIGN KEY ("projects_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_services_fk" FOREIGN KEY ("services_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_directions_fk" FOREIGN KEY ("directions_id") REFERENCES "public"."directions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subdirections_fk" FOREIGN KEY ("subdirections_id") REFERENCES "public"."subdirections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_industries_fk" FOREIGN KEY ("industries_id") REFERENCES "public"."industries"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_vacancies_fk" FOREIGN KEY ("vacancies_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_partners_fk" FOREIGN KEY ("partners_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_terms_fk" FOREIGN KEY ("terms_id") REFERENCES "public"."terms"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_publications_id_idx" ON "payload_locked_documents_rels" USING btree ("publications_id");
  CREATE INDEX "payload_locked_documents_rels_projects_id_idx" ON "payload_locked_documents_rels" USING btree ("projects_id");
  CREATE INDEX "payload_locked_documents_rels_services_id_idx" ON "payload_locked_documents_rels" USING btree ("services_id");
  CREATE INDEX "payload_locked_documents_rels_directions_id_idx" ON "payload_locked_documents_rels" USING btree ("directions_id");
  CREATE INDEX "payload_locked_documents_rels_subdirections_id_idx" ON "payload_locked_documents_rels" USING btree ("subdirections_id");
  CREATE INDEX "payload_locked_documents_rels_industries_id_idx" ON "payload_locked_documents_rels" USING btree ("industries_id");
  CREATE INDEX "payload_locked_documents_rels_vacancies_id_idx" ON "payload_locked_documents_rels" USING btree ("vacancies_id");
  CREATE INDEX "payload_locked_documents_rels_partners_id_idx" ON "payload_locked_documents_rels" USING btree ("partners_id");
  CREATE INDEX "payload_locked_documents_rels_terms_id_idx" ON "payload_locked_documents_rels" USING btree ("terms_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "publications" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "publications_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_publications_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "projects_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_version_stats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_projects_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "services_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "directions_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "directions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "directions_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subdirections" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "subdirections_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "industries_metrics" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "industries_logos" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "industries" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "industries_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_about_direction_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_about_vacancy_items_subitems" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_about_vacancy_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_be_plus_items_subitems" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_be_plus_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_advantages_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_reviews_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "vacancies_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_about_direction_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_about_vacancy_items_subitems" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_about_vacancy_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_be_plus_items_subitems" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_be_plus_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_advantages_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_faq_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_version_reviews_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_vacancies_v_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "partners_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "terms" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "terms_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec_xp" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec_xp_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_xp_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_xp_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec_cat" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec_cat_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_cat_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_cat_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec_car" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec_car_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_car_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_car_v_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec_prt" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "sec_prt_locales" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_prt_v" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_sec_prt_v_locales" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "publications" CASCADE;
  DROP TABLE "publications_locales" CASCADE;
  DROP TABLE "publications_rels" CASCADE;
  DROP TABLE "_publications_v" CASCADE;
  DROP TABLE "_publications_v_locales" CASCADE;
  DROP TABLE "_publications_v_rels" CASCADE;
  DROP TABLE "projects_stats" CASCADE;
  DROP TABLE "projects" CASCADE;
  DROP TABLE "projects_locales" CASCADE;
  DROP TABLE "projects_rels" CASCADE;
  DROP TABLE "_projects_v_version_stats" CASCADE;
  DROP TABLE "_projects_v" CASCADE;
  DROP TABLE "_projects_v_locales" CASCADE;
  DROP TABLE "_projects_v_rels" CASCADE;
  DROP TABLE "services" CASCADE;
  DROP TABLE "services_locales" CASCADE;
  DROP TABLE "services_rels" CASCADE;
  DROP TABLE "directions_logos" CASCADE;
  DROP TABLE "directions" CASCADE;
  DROP TABLE "directions_locales" CASCADE;
  DROP TABLE "subdirections" CASCADE;
  DROP TABLE "subdirections_locales" CASCADE;
  DROP TABLE "industries_metrics" CASCADE;
  DROP TABLE "industries_logos" CASCADE;
  DROP TABLE "industries" CASCADE;
  DROP TABLE "industries_locales" CASCADE;
  DROP TABLE "vacancies_about_direction_items" CASCADE;
  DROP TABLE "vacancies_about_vacancy_items_subitems" CASCADE;
  DROP TABLE "vacancies_about_vacancy_items" CASCADE;
  DROP TABLE "vacancies_be_plus_items_subitems" CASCADE;
  DROP TABLE "vacancies_be_plus_items" CASCADE;
  DROP TABLE "vacancies_advantages_items" CASCADE;
  DROP TABLE "vacancies_faq_items" CASCADE;
  DROP TABLE "vacancies_reviews_items" CASCADE;
  DROP TABLE "vacancies" CASCADE;
  DROP TABLE "vacancies_locales" CASCADE;
  DROP TABLE "vacancies_rels" CASCADE;
  DROP TABLE "_vacancies_v_version_about_direction_items" CASCADE;
  DROP TABLE "_vacancies_v_version_about_vacancy_items_subitems" CASCADE;
  DROP TABLE "_vacancies_v_version_about_vacancy_items" CASCADE;
  DROP TABLE "_vacancies_v_version_be_plus_items_subitems" CASCADE;
  DROP TABLE "_vacancies_v_version_be_plus_items" CASCADE;
  DROP TABLE "_vacancies_v_version_advantages_items" CASCADE;
  DROP TABLE "_vacancies_v_version_faq_items" CASCADE;
  DROP TABLE "_vacancies_v_version_reviews_items" CASCADE;
  DROP TABLE "_vacancies_v" CASCADE;
  DROP TABLE "_vacancies_v_locales" CASCADE;
  DROP TABLE "_vacancies_v_rels" CASCADE;
  DROP TABLE "partners_items" CASCADE;
  DROP TABLE "partners" CASCADE;
  DROP TABLE "partners_locales" CASCADE;
  DROP TABLE "partners_rels" CASCADE;
  DROP TABLE "terms" CASCADE;
  DROP TABLE "terms_locales" CASCADE;
  DROP TABLE "sec_xp" CASCADE;
  DROP TABLE "sec_xp_locales" CASCADE;
  DROP TABLE "_sec_xp_v" CASCADE;
  DROP TABLE "_sec_xp_v_locales" CASCADE;
  DROP TABLE "sec_cat" CASCADE;
  DROP TABLE "sec_cat_locales" CASCADE;
  DROP TABLE "_sec_cat_v" CASCADE;
  DROP TABLE "_sec_cat_v_locales" CASCADE;
  DROP TABLE "sec_car" CASCADE;
  DROP TABLE "sec_car_locales" CASCADE;
  DROP TABLE "_sec_car_v" CASCADE;
  DROP TABLE "_sec_car_v_locales" CASCADE;
  DROP TABLE "sec_prt" CASCADE;
  DROP TABLE "sec_prt_locales" CASCADE;
  DROP TABLE "_sec_prt_v" CASCADE;
  DROP TABLE "_sec_prt_v_locales" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_publications_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_projects_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_services_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_directions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_subdirections_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_industries_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_vacancies_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_partners_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_terms_fk";
  
  DROP INDEX "payload_locked_documents_rels_publications_id_idx";
  DROP INDEX "payload_locked_documents_rels_projects_id_idx";
  DROP INDEX "payload_locked_documents_rels_services_id_idx";
  DROP INDEX "payload_locked_documents_rels_directions_id_idx";
  DROP INDEX "payload_locked_documents_rels_subdirections_id_idx";
  DROP INDEX "payload_locked_documents_rels_industries_id_idx";
  DROP INDEX "payload_locked_documents_rels_vacancies_id_idx";
  DROP INDEX "payload_locked_documents_rels_partners_id_idx";
  DROP INDEX "payload_locked_documents_rels_terms_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "publications_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "projects_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "services_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "directions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "subdirections_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "industries_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "vacancies_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "partners_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "terms_id";
  DROP TYPE "public"."enum_publications_type";
  DROP TYPE "public"."enum_publications_background_type";
  DROP TYPE "public"."enum_publications_status";
  DROP TYPE "public"."enum__publications_v_version_type";
  DROP TYPE "public"."enum__publications_v_version_background_type";
  DROP TYPE "public"."enum__publications_v_version_status";
  DROP TYPE "public"."enum__publications_v_published_locale";
  DROP TYPE "public"."enum_projects_status";
  DROP TYPE "public"."enum__projects_v_version_status";
  DROP TYPE "public"."enum__projects_v_published_locale";
  DROP TYPE "public"."enum_vacancies_about_vacancy_items_variant";
  DROP TYPE "public"."enum_vacancies_be_plus_items_variant";
  DROP TYPE "public"."enum_vacancies_kind";
  DROP TYPE "public"."enum_vacancies_background_type";
  DROP TYPE "public"."enum_vacancies_status";
  DROP TYPE "public"."enum_vacancies_about_vacancy_variant";
  DROP TYPE "public"."enum_vacancies_be_plus_variant";
  DROP TYPE "public"."enum_vacancies_reviews_variant";
  DROP TYPE "public"."enum__vacancies_v_version_about_vacancy_items_variant";
  DROP TYPE "public"."enum__vacancies_v_version_be_plus_items_variant";
  DROP TYPE "public"."enum__vacancies_v_version_kind";
  DROP TYPE "public"."enum__vacancies_v_version_background_type";
  DROP TYPE "public"."enum__vacancies_v_version_status";
  DROP TYPE "public"."enum__vacancies_v_published_locale";
  DROP TYPE "public"."enum__vacancies_v_version_about_vacancy_variant";
  DROP TYPE "public"."enum__vacancies_v_version_be_plus_variant";
  DROP TYPE "public"."enum__vacancies_v_version_reviews_variant";
  DROP TYPE "public"."enum_terms_kind";
  DROP TYPE "public"."enum_sec_xp_expertise_elector_background_type";
  DROP TYPE "public"."enum_sec_xp_callback_background_type";
  DROP TYPE "public"."enum_sec_xp_journal_background_type";
  DROP TYPE "public"."enum_sec_xp_meta_crumb_variant";
  DROP TYPE "public"."enum__sec_xp_v_version_expertise_elector_background_type";
  DROP TYPE "public"."enum__sec_xp_v_version_callback_background_type";
  DROP TYPE "public"."enum__sec_xp_v_version_journal_background_type";
  DROP TYPE "public"."enum__sec_xp_v_version_meta_crumb_variant";
  DROP TYPE "public"."enum_sec_cat_catalog_background_type";
  DROP TYPE "public"."enum_sec_cat_callback_background_type";
  DROP TYPE "public"."enum_sec_cat_meta_crumb_variant";
  DROP TYPE "public"."enum__sec_cat_v_version_catalog_background_type";
  DROP TYPE "public"."enum__sec_cat_v_version_callback_background_type";
  DROP TYPE "public"."enum__sec_cat_v_version_meta_crumb_variant";
  DROP TYPE "public"."enum_sec_car_vacancies_background_type";
  DROP TYPE "public"."enum_sec_car_internships_background_type";
  DROP TYPE "public"."enum_sec_car_callback_background_type";
  DROP TYPE "public"."enum_sec_car_meta_crumb_variant";
  DROP TYPE "public"."enum__sec_car_v_version_vacancies_background_type";
  DROP TYPE "public"."enum__sec_car_v_version_internships_background_type";
  DROP TYPE "public"."enum__sec_car_v_version_callback_background_type";
  DROP TYPE "public"."enum__sec_car_v_version_meta_crumb_variant";
  DROP TYPE "public"."enum_sec_prt_callback_background_type";
  DROP TYPE "public"."enum_sec_prt_meta_crumb_variant";
  DROP TYPE "public"."enum__sec_prt_v_version_callback_background_type";
  DROP TYPE "public"."enum__sec_prt_v_version_meta_crumb_variant";`)
}
