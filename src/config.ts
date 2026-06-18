export interface SiteConfig {
  language: string
  siteTitle: string
  siteDescription: string
}

export interface NavLink {
  label: string
  targetId: string
}

export interface NavigationConfig {
  brandMark: string
  links: NavLink[]
}

export interface HeroConfig {
  wordmarkText: string
  eyebrow: string
  titleLine1: string
  titleLine2: string
  descriptionLine1: string
  descriptionLine2: string
  ctaText: string
  ctaTargetId: string
}

export interface PhilosophyConfig {
  eyebrow: string
  title: string
  body: string
  rollingWords: string[]
}

export interface ProjectMeta {
  label: string
  value: string
}

export interface ProjectData {
  id: string
  title: string
  location: string
  year: string
  image: string
  subtitle: string
  meta: ProjectMeta[]
  paragraphs: string[]
}

export interface GalleryConfig {
  sectionLabel: string
  title: string
  projects: ProjectData[]
}

export interface MediumItem {
  cn: string
  en: string
  description: string
}

export interface MediumsConfig {
  sectionLabel: string
  items: MediumItem[]
}

export interface FooterEntry {
  text: string
  href?: string
}

export interface FooterColumn {
  heading: string
  entries: FooterEntry[]
}

export interface FooterConfig {
  visionText: string
  brandName: string
  columns: FooterColumn[]
  copyright: string
  videoPath: string
}

export interface ProjectDetailConfig {
  backLabel: string
}

export const siteConfig: SiteConfig = {
  language: "",
  siteTitle: "",
  siteDescription: "",
}

export const navigationConfig: NavigationConfig = {
  brandMark: "",
  links: [],
}

export const heroConfig: HeroConfig = {
  wordmarkText: "",
  eyebrow: "",
  titleLine1: "",
  titleLine2: "",
  descriptionLine1: "",
  descriptionLine2: "",
  ctaText: "",
  ctaTargetId: "",
}

export const philosophyConfig: PhilosophyConfig = {
  eyebrow: "",
  title: "",
  body: "",
  rollingWords: [],
}

export const galleryConfig: GalleryConfig = {
  sectionLabel: "",
  title: "",
  projects: [],
}

export const mediumsConfig: MediumsConfig = {
  sectionLabel: "",
  items: [],
}

export const footerConfig: FooterConfig = {
  visionText: "",
  brandName: "",
  columns: [],
  copyright: "",
  videoPath: "",
}

export const projectDetailConfig: ProjectDetailConfig = {
  backLabel: "",
}

export function getProjectById(id: string): ProjectData | undefined {
  return galleryConfig.projects.find((p) => p.id === id)
}
