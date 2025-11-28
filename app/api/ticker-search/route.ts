import { NextResponse } from 'next/server';

interface YahooQuote {
  symbol: string;
  shortname?: string;
  longname?: string;
  exchDisp?: string;
  typeDisp?: string;
  isYahooFinance?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; 
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Yahoo Finance');
    }

    const data = await response.json();
    
    // Transform the response to a simpler format
    const results = (data.quotes || [])
      .filter((quote: YahooQuote) => quote.isYahooFinance) // Filter out irrelevant results if needed
      .map((quote: YahooQuote) => ({
        symbol: quote.symbol,
        shortname: quote.shortname || quote.longname || quote.symbol,
        exchDisp: quote.exchDisp,
        typeDisp: quote.typeDisp,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error fetching ticker search:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}
