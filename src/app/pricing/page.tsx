'use client';

import { useEffect, useState } from 'react';
import { Divider, Card, CardHeader, CardBody, Alert } from '@heroui/react';

export default function Pricing() {  
    const [alarm, setAlarm] = useState(false);
    
    useEffect(() => {
        if (alarm) {
            const timer = setTimeout(() => {
                setAlarm(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [alarm]);

    const payment = (plan_id: number) => {
        window.location.href = `/payment/${plan_id}`;
    }   

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-4 pb-16 gap-8 sm:p-20 sm:gap-16 font-[family-name:var(--font-geist-sans)]">
            <div className='w-full flex justify-center items-center'>
                <Alert isVisible={alarm} className="w-fit absolute" variant="solid" color="success" title={`У вас уже выбран бесплатный план`} />
                <h1 className="text-4xl font-bold text-center select-none mt-4 self-center">Тарифные планы</h1>
            </div>
            <main className="bg-transparent w-full sm:w-3/4 flex flex-col sm:flex-row gap-6 sm:gap-8 justify-center row-start-2 items-stretch mt-4">
                <Card className="py-4 w-full sm:w-1/3 md:w-1/4 hover:scale-105 sm:hover:scale-110 transition-all duration-500 active:scale-95 touch-manipulation flex flex-col" 
                    isPressable={true} onPress={() => setAlarm(true)}>
        
                    <CardHeader className="pb-0 pt-2 flex-col items-start">
                        <p className="text-lg uppercase font-bold select-none">Бесплатный</p>
                    </CardHeader>
                    <CardBody className="overflow-visible py-2">
                        <p className="text-green-400 text-2xl select-none">0 ₸</p>
                        <p className="text-gray-700 dark:text-gray-400 text-medium select-none">Пользуйтесь нашим сервисом сразу после регистрации</p>
                        <Divider className="my-4" />
                        <ul className="list-disc list-inside space-y-1 text-small text-start">
                            <li className='select-none'><b>3</b> запроса в день</li>
                        </ul>
                    </CardBody>
                </Card>
                
                <Card className="py-4 sm:w-1/3 md:w-1/4 hover:scale-105 sm:hover:scale-110 transition-all duration-500 active:scale-95 touch-manipulation flex flex-col" 
                      isPressable={true} onPress={() => {payment(1)}}>
                    <CardHeader className="pb-0 pt-2 flex-col items-start">
                        <p className="text-lg uppercase font-bold select-none">Персональный</p>
                    </CardHeader>
                    <CardBody>
                        <p className="text-green-400 text-2xl select-none">1 000 ₸</p>
                        <p className="text-gray-700 dark:text-gray-400 text-medium select-none">Подходит для персонального использования</p>
                        <Divider className="my-4" />
                        <ul className="list-disc list-inside space-y-1 text-small text-start">
                            <li className='select-none'><b>50</b> запросов в день</li>
                            <li className='select-none'>Доступ к <b>суммаризации</b></li>
                        </ul>
                    </CardBody>
                </Card>

                <Card className="py-4 w-full sm:w-1/3 md:w-1/4 hover:scale-105 sm:hover:scale-110 transition-all duration-500 active:scale-95 touch-manipulation flex flex-col" 
                      isPressable={true} onPress={() => {payment(2)}}>
                    <CardHeader className="pb-0 pt-2 flex-col items-start">
                        <p className="text-lg uppercase font-bold select-none">Профессиональный</p>
                    </CardHeader>
                    <CardBody>
                        <p className="text-green-400 text-2xl select-none">10 000 ₸</p>
                        <p className="text-gray-700 dark:text-gray-400 text-medium select-none">Подходит для персонального использования</p>
                        <Divider className="my-4" />
                        <ul className="list-disc list-inside space-y-1 text-small text-start">
                            <li className='select-none'><b>Бесконечное</b> количество запросов в день</li>
                            <li className='select-none'>Доступ к <b>суммаризации</b></li>
                            <li className='select-none self-start'>Прямой контакт с разработчиками</li>
                        </ul>
                    </CardBody>
                </Card>
            </main>
        </div>
    );
}