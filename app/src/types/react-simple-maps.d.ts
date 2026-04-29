declare module "react-simple-maps" {
  import { ComponentType, CSSProperties, ReactNode } from "react";

  export interface ComposableMapProps {
    projection?: string;
    projectionConfig?: {
      scale?: number;
      center?: [number, number];
      rotate?: [number, number, number];
    };
    width?: number;
    height?: number;
    style?: CSSProperties;
    children?: ReactNode;
    className?: string;
  }

  export interface GeographiesProps {
    geography: string | Record<string, unknown>;
    children: (data: {
      geographies: GeographyItem[];
    }) => ReactNode;
  }

  export interface GeographyItem {
    rsmKey: string;
    id: string;
    type: string;
    properties: Record<string, unknown>;
    geometry: Record<string, unknown>;
  }

  export interface GeographyProps {
    geography: GeographyItem;
    key?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
    className?: string;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
    onClick?: (event: React.MouseEvent) => void;
  }

  export interface ZoomableGroupProps {
    zoom?: number;
    center?: [number, number];
    onMoveStart?: (event: unknown) => void;
    onMove?: (event: unknown) => void;
    onMoveEnd?: (event: unknown) => void;
    children?: ReactNode;
  }

  export interface MarkerProps {
    coordinates: [number, number];
    children?: ReactNode;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
  }

  export const ComposableMap: ComponentType<ComposableMapProps>;
  export const Geographies: ComponentType<GeographiesProps>;
  export const Geography: ComponentType<GeographyProps>;
  export const ZoomableGroup: ComponentType<ZoomableGroupProps>;
  export const Marker: ComponentType<MarkerProps>;
}
