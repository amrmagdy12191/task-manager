export interface ProfileInput { displayName: string; avatarInitials: string; avatarColorIndex: number }
export interface PublicProfile extends ProfileInput { email: string }
export interface NewAccount extends ProfileInput { email: string; password: string }
export class DataConflict extends Error {}
