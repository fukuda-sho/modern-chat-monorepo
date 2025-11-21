/**
 * Form data type definitions
 */

export interface LoginFormData {
  email: string;
  password: string;
}

export interface SignupFormData {
  username: string;
  email: string;
  password: string;
}

export interface CreateRoomFormData {
  name: string;
}

export interface SendMessageFormData {
  content: string;
}
