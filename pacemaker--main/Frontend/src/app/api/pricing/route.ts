import { NextResponse } from 'next/server';

export async function GET() {
  const plans = [
    {
      id: "plan-c",
      name: "Plan C",
      badge: "most popular",
      subtitle: "Videos + QBank + Test Series",
      durations: [
        { label: "3 Months", subText: "+ 1 month ext.", price: 16999, originalPrice: 28999, isRecommended: false },
        { label: "6 Months", price: 28499, originalPrice: 37499, isRecommended: false },
        { label: "9 Months", subText: "+ 1 month ext.", price: 31999, originalPrice: 40999, isRecommended: false },
        { label: "12 Months", subText: "+ 1 month ext.", price: 36999, originalPrice: 45999, isRecommended: false },
        { label: "16 Months", subText: "+ 1 month ext.", price: 43999, originalPrice: 57999, isRecommended: true },
        { label: "24 Months", price: 52999, originalPrice: 61999, isRecommended: false },
        { label: "36 Months", price: 64999, originalPrice: 73999, isRecommended: false }
      ]
    },
    {
      id: "plan-b",
      name: "Plan B",
      subtitle: "QBank + Test Series",
      durations: [
        { label: "3 Months", subText: "+ 1 month ext.", price: 6999, originalPrice: 12999, isRecommended: false },
        { label: "6 Months", price: 11999, originalPrice: 17999, isRecommended: false },
        { label: "9 Months", subText: "+ 1 month ext.", price: 15999, originalPrice: 21999, isRecommended: false },
        { label: "12 Months", price: 18999, originalPrice: 24999, isRecommended: false }
      ]
    },
    {
      id: "plan-a",
      name: "Plan A",
      subtitle: "Test Series",
      durations: [
        { label: "9 Months", price: 9999, originalPrice: 12999, isRecommended: false },
        { label: "12 Months", price: 14999, originalPrice: 17999, isRecommended: false }
      ]
    }
  ];

  await new Promise(resolve => setTimeout(resolve, 300)); // Quick DB simulation
  return NextResponse.json(plans);
}
