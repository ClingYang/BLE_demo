#include "device_control.h"
#include <string.h>
extern UART_HandleTypeDef huart2;
Device devices[] = {
    {"LIGHT", GPIOB, GPIO_PIN_8},
    {"FAN", GPIOB, GPIO_PIN_9},
    {"CURTAIN", GPIOB, GPIO_PIN_7}};

#define DEVICE_COUNT (sizeof(devices) / sizeof(devices[0]))

/**
 * 控制设备的函数
 * 该函数通过接收一个包含设备控制指令的字符串来控制设备的开关
 *
 * @param rbuf 包含设备控制指令的字符串
 */
void controlDevice(const char *rbuf)
{
    // 遍历所有设备
    for (int i = 0; i < DEVICE_COUNT; i++)
    {
        // 检查接收的字符串中是否包含当前设备的名称
        if (strstr((char *)rbuf, devices[i].deviceName))
        {
            // 如果包含设备名称，进一步检查是否包含"ON"或"OFF"指令

            if (strstr((char *)rbuf, "ON"))
            {
                // 如果包含"ON"指令，设置设备的GPIO引脚为高电平，开启设备
                HAL_GPIO_WritePin(devices[i].gpioPort, devices[i].gpioPin, GPIO_PIN_SET);
                HAL_UART_Transmit(&huart2, (uint8_t *)rbuf, strlen(rbuf), HAL_MAX_DELAY);
            }
            else if (strstr((char *)rbuf, "OFF"))
            {
                // 如果包含"OFF"指令，设置设备的GPIO引脚为低电平，关闭设备
                HAL_GPIO_WritePin(devices[i].gpioPort, devices[i].gpioPin, GPIO_PIN_RESET);
                HAL_UART_Transmit(&huart2, (uint8_t *)rbuf, strlen(rbuf), HAL_MAX_DELAY);
            }
        }
    }
}