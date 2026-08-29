/* eslint-disable @typescript-eslint/no-empty-object-type -- intentional module augmentation */
import { RootState } from 'store'

declare module 'react-redux' {
  interface DefaultRootState extends RootState {}
}
