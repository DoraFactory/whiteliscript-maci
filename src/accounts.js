const { QueryClient, setupStakingExtension } = require("@cosmjs/stargate");
const { Tendermint34Client } = require("@cosmjs/tendermint-rpc");
const authquery = require("cosmjs-types/cosmos/auth/v1beta1/query");
const pageQuery = require("cosmjs-types/cosmos/base/query/v1beta1/pagination");

async function fetchAllAccounts() {
  const rpcEndpoint = "http://47.128.207.247:26657";

  const tmClient = await Tendermint34Client.connect(rpcEndpoint);
  const client = await QueryClient.withExtensions(tmClient, setupStakingExtension);

  const path = "/cosmos.auth.v1beta1.Query/Accounts";
  let allAccounts = [];
  let nextKey = undefined;
  let total = 0;

  do {
    const pagination = pageQuery.PageRequest.fromPartial({
      key: nextKey,
      offset: BigInt(0),
      limit: BigInt(50), 
      countTotal: false,
      reverse: false,
    });

    const accountsReq = authquery.QueryAccountsRequest.encode({
      pagination,
    }).finish();

    const queryResponse = await client.queryAbci(path, accountsReq, 7166000);
    const response = authquery.QueryAccountsResponse.decode(queryResponse.value);

    console.log(response)

    allAccounts.push(...response.accounts);

    nextKey = response.pagination?.nextKey;
    if (total === 0 && response.pagination?.total) {
      total = Number(response.pagination.total);
    }

    console.log(`Fetched ${allAccounts.length} accounts so far...`);
  } while (nextKey && nextKey.length > 0);

  console.log(`Total Accounts: ${total}`);
  return allAccounts;
}

async function main() {
  try {
    const allAccounts = await fetchAllAccounts();
    console.log(`Fetched all ${allAccounts.length} accounts:`);
    console.log(allAccounts);
  } catch (error) {
    console.error("Error fetching accounts:", error);
  }
}

main();