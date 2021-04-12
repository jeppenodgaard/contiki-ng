TIMEOUT(21600000, log.log("last msg: " + msg + "\n")); /* 6 hours in milliseconds */

var motes = sim.getMotes();
var m_root = sim.getMoteWithID(1);
var expect_all_routes_m = 35; /* minutes */
var expect_all_routes_ms = expect_all_routes_m * 60 * 1000;
var expect_routes_stable_m = 180; /* minutes */
var expect_routes_stable_ms = expect_routes_stable_m * 60 * 1000;
var expect_udp_received_ms = 30 * 1000;
var parent_switch = 0;

log.generateMessage(5 * 1000, "start-rpl");
YIELD_THEN_WAIT_UNTIL(msg.equals("start-rpl"));

write(m_root, "rpl-set-root 1");

log.log("Waiting for motes to join (timeout " + expect_all_routes_m + " minutes)\n");
while (true) {
    log.generateMessage(5 * 1000, "check-routes");
    YIELD_THEN_WAIT_UNTIL(msg.equals("check-routes"));
    write(m_root, "routes");
    YIELD_THEN_WAIT_UNTIL(msg.startsWith("Routing links") || msg.startsWith("No routing links"));
    log.log(msg + "\n");
    if (msg.contains(sim.getMotesCount().toString())) {
        log.log("All motes joined after " + (sim.getSimulationTimeMillis() / 1000) + " seconds\n");
        break;
    } else if (sim.getSimulationTimeMillis() > expect_all_routes_ms) {
        log.log("Motes did not join in time\n");
        log.testFailed();
    }
}

log.log("Checking stability for " + expect_routes_stable_m + " minutes\n");
log.generateMessage(expect_routes_stable_ms, "check-routes");
while (true) {
    YIELD();

    if(msg.contains("] no parent")) {
        log.log("Mote " + id + " discarded it's parent\n");
        parent_switch++;
    } else if (msg.equals("check-routes")) {
        if(parent_switch > 0) {
            log.log("Detected " + parent_switch + " parent switches\n");
            log.testFailed();
        }
        write(m_root, "routes");
        YIELD_THEN_WAIT_UNTIL(msg.startsWith("Routing links") || msg.startsWith("No routing links"));
        log.log(msg + "\n");
        if (msg.contains(sim.getMotesCount().toString())) {
            log.log("All motes still present\n");
            break;
        } else {
            log.log("Not all motes present\n");
            log.testFailed();
        }
    }
}

log.testOK(); /* Report test success and quit */
