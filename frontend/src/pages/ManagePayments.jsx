import React from 'react'
import { Plus } from 'lucide-react'
import DashboardNavbar from '../components/DashboardNavbar'
import Footer from '../components/Footer'

const savedCards = []

const ManagePayments = () => {
  return (
    <div className='min-h-screen bg-slate-50'>
      <DashboardNavbar />

      <div className='pt-34 md:pt-30 pb-24'>
        <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md'>
            {/* Header */}
            <div className='bg-orange-500 px-6 py-5'>
              <h1 className='text-lg font-bold tracking-wide text-slate-900'>MANAGE PAYMENTS</h1>
            </div>

            {/* Body */}
            <div className='flex items-center justify-between px-6 py-6'>
              <p className='text-sm font-medium text-slate-900'>
                {savedCards.length > 0 ? `${savedCards.length} card(s) on file` : 'No cards found'}
              </p>

              <button
                type='button'
                onClick={() => {}}
                className='inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800'
              >
                Add new card
                <span className='border-l border-white/30 pl-2'>
                  <Plus size={14} />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default ManagePayments