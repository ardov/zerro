import json2mq from 'json2mq'
import useMediaQuery from '@mui/material/useMediaQuery'

export function useHomeBar() {
  const iPhoneXXS11ProMediaQuery = json2mq({
    screen: true,
    minDeviceWidth: 375,
    maxDeviceWidth: 812,
    '-webkit-device-pixel-ratio': 3,
  })
  const iPhoneXR11MediaQuery = json2mq({
    screen: true,
    minDeviceWidth: 414,
    maxDeviceWidth: 896,
    '-webkit-device-pixel-ratio': 2,
  })
  const iPhoneXSMax11ProMaxMediaQuery = json2mq({
    screen: true,
    minDeviceWidth: 414,
    maxDeviceWidth: 896,
    '-webkit-device-pixel-ratio': 3,
  })
  const isiPhoneWithHomeBar = useMediaQuery(
    `${iPhoneXXS11ProMediaQuery}, ${iPhoneXR11MediaQuery}, ${iPhoneXSMax11ProMaxMediaQuery}`
  )
  // I don't know why, but for iPhone 8 Plus media query above is also met, so I had to use this workaround.
  const isiPhone8Plus =
    window.screen.height / window.screen.width === 736 / 414 &&
    window.devicePixelRatio === 3
  const hasHomeBar =
    // @ts-ignore
    window.navigator.standalone && isiPhoneWithHomeBar && !isiPhone8Plus
  return hasHomeBar
}
