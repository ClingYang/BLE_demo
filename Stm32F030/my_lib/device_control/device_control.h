#ifndef DEVICE_CONTROL_H
#define DEVICE_CONTROL_H

#include "main.h"
/*  { LIGHT: "ON"}
        { LIGHT: "OFF"}
        { FAN: "ON" }
        { FAN: "OFF" }
        { CURTAIN: "ON" }
        { CURTAIN: "OFF" } */
typedef struct
{
    const char *deviceName;
    GPIO_TypeDef *gpioPort;
    uint16_t gpioPin;
} Device;

void controlDevice(const char *rbuf);

#endif // DEVICE_CONTROL_H