require('module-alias/register');
const users = require( './users' );

describe( 'users', () => {
  it( 'should work', () => {
    expect( true ).toEqual( true );
  } )

  it( 'should not work', () => {
    expect( false ).toEqual( false );
  } )
} )
