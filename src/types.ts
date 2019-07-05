export interface City {
  id: string;
  uk: string;
}

export interface Department extends City {}

export interface User {
  shippingAddress: {
    city: string;
    departmentNovaposhta: string;
  };
  bio: string;
  displayName: string;
  emailAddress: string;
  mobileNumber: string;
  socials?: {
    facebook: string;
    instagram: string;
  };
  profilePic: string;
  token: string;
  username: string;
}
export interface Order {
  id: string;
  priceOfItem: string;
}

type ProductStatus = 'forsale' | 'reserved' | 'sold' | 'banned' | 'deleted';

export interface Product {
  _id: string;
  categoryIds: number[];
  comments?: string[]; // optional
  createdAt: Date;
  currency: string;
  description: string;
  dropId: string;
  location: {
    type: string;
    coordinates: {
      latitude?: number;
      longitude?: number;
    };
  };
  locality: string;
  photoURIs: string[];
  price: string;
  quantity: number;
  seller: User;
  status: ProductStatus;
  tags?: string[]; // optional
  typeIds: number[];
  updatedAt: Date;
  uuid: string;
  weight: number;
}

export interface Drop {
  _id: string;
  createdAt: Date;
  description?: string;
  posted: boolean;
  amISubscribed: boolean;
  products: Product[];
  scheduledAt: Date;
  seller: User;
  subscribers: User[];
  updatedAt: Date;
  uuid: string;
}

export interface Payment {
  redirectUrl: string;
  PaReq: string;
  url: string;
}
