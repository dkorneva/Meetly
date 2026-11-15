export type RemoteUser = {
  id: string;
  name: string;
  email: string;
  dark: boolean;
  calendar: boolean;
  avatar?: string;
};
export type RemoteRestaurant = {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  cuisine: string;
  price: number;
  priceSource?: string | null;
  priceFetchedAt?: string | null;
  dataSourceUrl?: string | null;
  phone: string;
  website: string;
  outdoor: boolean;
  source: string;
  openingHours: string;
  openNow?: boolean | null;
  cuisineLabel?: string;
  matchLabel?: string;
  available?: boolean;
};
export type RemoteDiscovery = {
  items: RemoteRestaurant[];
  center: { latitude: number; longitude: number };
  warning?: string;
  source: string;
  total: number;
  changed?: boolean;
};
export type RemoteMeeting = {
  updatedAt?: string;
  lastMessage?: { text: string; name: string; senderId: string; kind: string; createdAt: string } | null;
  unavailableCandidateCount?: number;
  id: string;
  ownerId: string;
  title: string;
  startsAt: string;
  status: "voting" | "selected" | "booked" | "completed";
  restaurantId: string | null;
  bookedAt: string | null;
  completedAt: string | null;
  city: string;
  format: string;
  members: {
    userId: string;
    budget: number;
    cuisines: string;
    user: { id: string; name: string };
  }[];
  candidates: {
    restaurant: RemoteRestaurant;
    votes: { userId: string; restaurantId: string }[];
  }[];
};
export type RemoteMessage = {
  id: string;
  senderId: string;
  name: string;
  text: string;
  kind: "text" | "system" | "selected";
  createdAt: string;
  reactions: { userId: string }[];
  attachment?: { name: string; uri: string; image: boolean };
};

export type CatalogFilters = {
  cuisines: string[];
  budget: {min:number; max:number; step:number; prices:number[]};
  formats: string[];
};
