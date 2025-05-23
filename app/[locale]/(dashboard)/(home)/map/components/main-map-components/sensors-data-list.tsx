import React from 'react'
import { Icon } from '@iconify/react'
import { useTranslation } from 'react-i18next'

interface SensorsDataListProps {
  data?: any
}

const SensorsDataList: React.FC<SensorsDataListProps> = ({ data }) => {
  const { t } = useTranslation()

  return (
    <div className='grid grid-cols-1 px-4'>
      <div>
        <ul className='w-full'>
          {data?.virtual_odometer_continuous && (
            <ListItem 
              label={t('map_page.odometer')} 
              value={data.virtual_odometer_continuous} 
            />
          )}
          {data?.['(can)_engine_hours_(total)'] && (
            <ListItem 
              label={t('map_page.engine_hours')} 
              value={data['(can)_engine_hours_(total)']} 
            />
          )}
          {data?.['(can)_fuel_tank_level'] && (
            <ListItem 
              label={t('map_page.fuel_level')} 
              value={data['(can)_fuel_tank_level']} 
            />
          )}
          {data?.['(can)_rpm'] && (
            <ListItem 
              label={t('map_page.rpm')} 
              value={data['(can)_rpm']} 
            />
          )}
        </ul>
      </div>
    </div>
  );
};

const ListItem = ({ label, value }: { label: string; value: string | number }) => (
  <>
    <li className='flex text-body-color dark:text-dark-6 text-sm'>
      <div className='flex items-center gap-2 w-full'>
        <div className='label-item flex items-center gap-0 w-full'>
          <span className='mr-1.5 mt-0.5 text-primary'>
            <Icon icon='fa-regular:dot-circle' className='text-sm' />
          </span>
          <span className='text-gray-600'>{label}</span>
        </div>
        <div className='value-item w-full'>
          <span className='text-gray-600'>: {value}</span>
        </div>
      </div>
    </li>
    <div className='border-b border-gray-300 my-2 px-2'></div>
  </>
);

export default SensorsDataList; 