import { Transform } from 'stream';
import { zipObject } from './utils';

const COLUMNS_LINE = 'Index,Timestamp,Event Type,Player Id,Event Data';
const COLUMNS = COLUMNS_LINE.split(',');

export class StripImg extends Transform {
  private rawHeader: any[];
  public header: any;

  constructor() {
    super();
    this.rawHeader = [];
    this.header = null;
  }

  public _transform(data: any, encoding: any, done: () => void) {
    /*
    this.push(data);
    done();
    */

    if (!this.header) {
      this.rawHeader.push(data);
      if (this.isHeaderEnd(data)) {
        this.header = this.parseRawHeader(this.rawHeader);
        // Let the world know we are done parsing the header
        this.emit('header', this.header);
        this.push({ header: this.header });
      }
    // After parsing the header, push data rows
    } else {
      console.log(data);
      this.push(this.parseRow(data));
    }
    done();
  }

  // Test if a line is the last header item
  private isHeaderEnd(data: any[]): boolean {
    return data.join(',') === COLUMNS_LINE;
  }

  // Make header lines one pretty object
  private parseRawHeader(rawHeader: any[]) {
    let newHeader: any;

    newHeader.Players = [];
    rawHeader.forEach((row) => {
      const parsedHeaderRow = this.parseHeaderRow(row);
      // Players are added to an array
      if (parsedHeaderRow.Player) {
        newHeader.Players.push(parsedHeaderRow.Player);
      // The rest is just added to the header object
      } else {
        newHeader = Object.assign(newHeader, parsedHeaderRow)
      }
    });
    return newHeader;
  }

  private parseHeaderRow(row: any[]): any {
    const key = row[0];
    const result: any = {};

    if (key.match(/src="data:image\//)) {
      result.Title = key;
    } else if (key === 'Player' || key === 'Map') {
      result[key] = {
        id: row[1],
        name: row[2]
      };
    } else if (key === 'Time Range') {
      result[key] = {
        end: row[2],
        start: row[1]
      };
    } else if (key === 'Index') {
      result.Columns = row;
    } else {
      result[key] = row[1];
    }
    return result;
  }

  // Parse a data row into an object
  private parseRow(row: any): any {
    const result = zipObject(COLUMNS, row);
    const  eventData = result['Event Data'] as string;

    result['Event Data'] = {};
    eventData.split(', ').forEach((item: string ) => {
      const parts = item.split('=');
      result['Event Data'][parts[0]] = parts[1];
    });
    return result;
  }

}
