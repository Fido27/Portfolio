import { NextRequest, NextResponse } from 'next/server';

// Enhanced country data endpoint
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const countryId = searchParams.get('countryId');
		const dataType = searchParams.get('type') || 'overview';

		if (!countryId) {
			return NextResponse.json({ error: 'Country ID is required' }, { status: 400 });
		}

		// Mock enhanced data - in real implementation, fetch from Appwrite or external APIs
		const enhancedData = {
			economic: {
				gdp_nominal: Math.floor(Math.random() * 5000000000000) + 100000000000,
				gdp_ppp: Math.floor(Math.random() * 6000000000000) + 200000000000,
				gdp_per_capita: Math.floor(Math.random() * 50000) + 5000,
				gini_coefficient: (Math.random() * 0.5 + 0.2).toFixed(2),
				inflation_rate: (Math.random() * 10 - 2).toFixed(1),
				unemployment_rate: (Math.random() * 15 + 2).toFixed(1),
				exports: Math.floor(Math.random() * 500000000000) + 50000000000,
				imports: Math.floor(Math.random() * 500000000000) + 50000000000,
				foreign_reserves: Math.floor(Math.random() * 1000000000000) + 100000000000,
				public_debt_gdp: (Math.random() * 100 + 20).toFixed(1),
			},
			political: {
				government_type: ['Federal Republic', 'Parliamentary Democracy', 'Constitutional Monarchy', 'Presidential Republic'][Math.floor(Math.random() * 4)],
				leader_title: ['President', 'Prime Minister', 'Chancellor', 'Monarch'][Math.floor(Math.random() * 4)],
				leader_name: ['John Smith', 'Maria Garcia', 'Wang Li', 'Ahmed Hassan'][Math.floor(Math.random() * 4)],
				independence_year: Math.floor(Math.random() * 200) + 1800,
				un_member: Math.random() > 0.1,
				eu_member: Math.random() > 0.8,
				nato_member: Math.random() > 0.7,
				democracy_index: (Math.random() * 10).toFixed(1),
				press_freedom_index: Math.floor(Math.random() * 180) + 1,
				corruption_perception_index: Math.floor(Math.random() * 100) + 1,
			},
			social: {
				literacy_rate: (Math.random() * 30 + 70).toFixed(1),
				life_expectancy: (Math.random() * 20 + 60).toFixed(1),
				urbanization_rate: (Math.random() * 60 + 40).toFixed(1),
				internet_penetration: (Math.random() * 70 + 30).toFixed(1),
				median_age: (Math.random() * 30 + 20).toFixed(1),
				fertility_rate: (Math.random() * 3 + 1).toFixed(2),
				healthcare_expenditure_gdp: (Math.random() * 10 + 2).toFixed(1),
				education_expenditure_gdp: (Math.random() * 8 + 2).toFixed(1),
			},
			environmental: {
				average_temperature: (Math.random() * 40 - 10).toFixed(1),
				annual_rainfall: Math.floor(Math.random() * 2000) + 100,
				carbon_emissions_mt: Math.floor(Math.random() * 1000) + 10,
				renewable_energy_percentage: (Math.random() * 80 + 10).toFixed(1),
				forest_coverage_percentage: (Math.random() * 70 + 10).toFixed(1),
				water_stress_index: Math.floor(Math.random() * 5) + 1,
				biodiversity_index: (Math.random() * 100).toFixed(1),
				air_quality_index: Math.floor(Math.random() * 200) + 20,
			},
			cultural: {
				national_anthem: ['Land of the Free', 'Unity and Strength', 'Forever Our Home', 'The Brave People'][Math.floor(Math.random() * 4)],
				national_sport: ['Football', 'Cricket', 'Basketball', 'Tennis', 'Athletics'][Math.floor(Math.random() * 5)],
				famous_food: ['Traditional Stew', 'Grilled Meats', 'Fresh Seafood', 'Vegetarian Delights', 'Spicy Curries'][Math.floor(Math.random() * 5)],
				famous_people: ['Innovative Scientists', 'World-Class Artists', 'Legendary Athletes', 'Influential Leaders', 'Talented Musicians'][Math.floor(Math.random() * 5)],
				tourism_sites: Math.floor(Math.random() * 50) + 5,
				cultural_heritage_sites: Math.floor(Math.random() * 30) + 1,
				annual_festivals: Math.floor(Math.random() * 20) + 2,
				national_museums: Math.floor(Math.random() * 100) + 10,
			},
			timeline: [
				{
					year: Math.floor(Math.random() * 50) + 1950,
					title: 'Major Political Change',
					description: 'Significant shift in government structure or leadership',
					category: 'political',
					importance: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)]
				},
				{
					year: Math.floor(Math.random() * 50) + 1950,
					title: 'Economic Reform',
					description: 'Major changes to economic policy or trade relations',
					category: 'economic',
					importance: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)]
				},
				{
					year: Math.floor(Math.random() * 50) + 1950,
					title: 'Social Movement',
					description: 'Significant social change or civil rights advancement',
					category: 'social',
					importance: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)]
				},
				{
					year: Math.floor(Math.random() * 50) + 1950,
					title: 'Cultural Achievement',
					description: 'Major cultural contribution or international recognition',
					category: 'cultural',
					importance: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)]
				},
				{
					year: Math.floor(Math.random() * 50) + 1950,
					title: 'Environmental Initiative',
					description: 'Major environmental policy or conservation effort',
					category: 'environmental',
					importance: ['critical', 'high', 'medium', 'low'][Math.floor(Math.random() * 4)]
				}
			].sort((a, b) => a.year - b.year)
		};

		// Return specific data type or all data
		const data = dataType === 'all' ? enhancedData : enhancedData[dataType as keyof typeof enhancedData];

		if (!data) {
			return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
		}

		return NextResponse.json({
			countryId,
			dataType,
			data,
			lastUpdated: new Date().toISOString()
		});

	} catch (error) {
		console.error('Enhanced country data API error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}

// POST endpoint for updating enhanced data
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { countryId, dataType, data } = body;

		if (!countryId || !dataType || !data) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
		}

		// In a real implementation, this would update the data in Appwrite
		// For now, just return success
		
		return NextResponse.json({
			success: true,
			message: `Enhanced data updated for country ${countryId}`,
			countryId,
			dataType,
			updatedFields: Object.keys(data),
			timestamp: new Date().toISOString()
		});

	} catch (error) {
		console.error('Enhanced country data update error:', error);
		return NextResponse.json(
			{ error: 'Internal server error' },
			{ status: 500 }
		);
	}
}