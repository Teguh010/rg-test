import type { NextApiRequest, NextApiResponse } from 'next'
import { generateTripStopPDF } from '@/lib/server-pdf-generator'
import { jsPDF } from 'jspdf'
import nodemailer from 'nodemailer'
import 'jspdf-autotable'
import { serverAddressCacheGet, serverAddressCacheAdd } from "@/models/address_cache";
import { fetchAddress } from "@/components/maps/here-map/utils/reverse-geocode";

type ResponseData = {
  message?: string
  error?: string
  emails?: string[]
  data?: any
  stack?: string
  timestamp?: string
  logs?: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData | Buffer>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token, schedule_date, format = 'pdf', email, data } = req.body;
    const report_type = data?.params?.report_type;

    const validReportTypes = [
      'trip_stop_report', 
      'maintenance_report', 
      'fuel_usage_report',
      'report_ok',
      'report_fail'
    ];
    if (!report_type || !validReportTypes.includes(report_type)) {
      return res.status(400).json({ 
        error: 'Invalid report type',
        message: `Received report_type: ${report_type}, Valid types are: ${validReportTypes.join(', ')}`
      });
    }

    // Handle test report types
    if (report_type === 'report_fail') {
      throw new Error('Test failure - report_fail type requested');
    }
    if (report_type === 'report_ok') {
      return res.status(200).json({
        message: 'Test success - report_ok type requested',
        data: { test: true }
      });
    }

    // Handle multiple email formats
    const emailRecipients = Array.isArray(email) 
      ? email 
      : email?.includes(',') 
        ? email.split(',').map(e => e.trim())
        : email 
          ? [email] 
          : [];

    if (!token || !schedule_date) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let parsedData = data
    
    if (typeof data === 'string') {
      try {
        parsedData = JSON.parse(data);
      } catch (parseError) {
        console.error('Failed to parse data:', parseError);
        throw new Error('Invalid data format');
      }
    }

    // Pindahkan blok enrichment ke sini
    if (parsedData?.data) {
      for (const vehicleData of parsedData.data) {
        if (vehicleData.d?.length > 0) {
          vehicleData.d = await enrichAddresses(vehicleData.d, token);
        }
      }
    }

    // [TEMPORARY] Comment out PDF generation and email

    if (format === 'pdf' && parsedData) {
      const doc = new jsPDF({ 
        putOnlyUsedFonts: true,
        orientation: 'landscape'
      });

      doc.viewerPreferences({
        HideToolbar: false,
        HideMenubar: false,
        HideWindowUI: false,
        DisplayDocTitle: true,
        NonFullScreenPageMode: 'UseOutlines'
      });

      generateTripStopPDF({
        doc,
        data: parsedData.data,
        totals: parsedData.totals,
        dateFormat: 'dd/MM/yyyy',
        unitDistance: 'km'
      })

      const pdfBuffer = doc.output('arraybuffer');

      if (emailRecipients.length > 0) {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: emailRecipients.join(', '),
          subject: `Trip Stop Report - ${schedule_date}`,
          text: `Please find attached the Trip Stop Report for ${schedule_date}`,
          attachments: [
            {
              filename: `trip_stop_report_${schedule_date}.pdf`,
              content: Buffer.from(pdfBuffer),
              contentType: 'application/pdf',
            },
          ],
        });

        return res.status(200).json({ 
          message: 'Report generated and sent to email successfully',
          emails: emailRecipients
        });
      }

      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader(
        'Content-Disposition', 
        `attachment; filename=trip_stop_report_${schedule_date}.pdf`
      );
      return res.send(Buffer.from(pdfBuffer));
    }


    // Return raw data for analysis
    return res.status(200).json({
      message: 'Data analysis only - PDF generation disabled',
      data: parsedData,
      logs: {
        dataStructure: parsedData?.data?.map((v: any) => ({
          objectid: v.objectid,
          entries: v.d?.length,
          firstEntry: v.d?.[0]
        }))
      }
    })

  } catch (error) {
    console.error('Trip stop error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).json({
      error: 'Failed to generate report',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
} 

const enrichAddresses = async (entries: any[], token: string) => {
  
  const enrichedEntries = await Promise.all(
    entries.map(async (entry, index) => {
      try {
        // Proses address utama
        if ((!entry.address || entry.address === 'null') && entry.lat && entry.lon) {
          
          const cachedAddress = await serverAddressCacheGet(token, entry.lat, entry.lon);

          if (cachedAddress?.result) {
            entry.address = cachedAddress.result;
          } else {
            const hereAddress = await fetchAddress(entry.lat, entry.lon);
            
            if (hereAddress?.address?.label) {
              entry.address = hereAddress.address.label
                .replace(/[^\x00-\x7F]/g, '')
                .replace(/\u00A0/g, ' ')
                .normalize('NFKC')
              await serverAddressCacheAdd(
                token, 
                [
                  { 
                    lat: entry.lat, 
                    lng: entry.lon, 
                    a: entry.address 
                  }
                ]
              );
            }
          }
        }

        // Proses next_address
        if ((!entry.next_address || entry.next_address === 'null') && entry.next_lat && entry.next_lon) {
          
          const cachedNextAddress = await serverAddressCacheGet(token, entry.next_lat, entry.next_lon);

          if (cachedNextAddress?.result) {
            entry.next_address = cachedNextAddress.result;
          } else {
            const hereNextAddress = await fetchAddress(entry.next_lat, entry.next_lon);
            
            if (hereNextAddress?.address?.label) {
              entry.next_address = hereNextAddress.address.label;
              await serverAddressCacheAdd(
                token,
                [
                  {
                    lat: entry.next_lat,
                    lng: entry.next_lon,
                    a: entry.next_address
                  }
                ]
              );
            }
          }
        }
      } catch (error) {
        console.error('Error in entry processing:', {
          entryIndex: index,
          error: error.message,
          stack: error.stack
        });
      }
      
      return entry;
    })
  );
  
  return enrichedEntries;
}; 