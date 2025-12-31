import { createNavigationContainerRef } from "@react-navigation/native";

export type RootStackParamList = {
  Home:
    | {
        initialTab?: "Suggested" | "Songs" | "Artists" | "Albums";
        query?: string;
        selectedArtist?: string;
      }
    | undefined;

  Player: undefined;
  Queue: undefined;

  Album:
    | {
        albumName: string;
        albumId?: string;
        seedSong?: any;
        songs?: any[];
      }
    | undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params as any);
  }
}
